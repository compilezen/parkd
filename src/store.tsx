import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { syncParkingUpdates } from './live-updates';
import type { LiveUpdateStatus } from './live-update-model';
import { parseSpot, STORAGE_KEY, type ParkingSpot } from './parking';

type Store = {
  spot: ParkingSpot | null; loading: boolean; loadError: string; liveStatus: LiveUpdateStatus;
  showParkingUpdate: () => Promise<void>;
  persist: (value: ParkingSpot | null) => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function ParkingProvider({ children }: { children: ReactNode }) {
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const writing = useRef(false);
  const [liveStatus, setLiveStatus] = useState<LiveUpdateStatus>('off');
  const canReconcile = useRef(false);
  const latestSpot = useRef<ParkingSpot | null>(null);
  async function updateCard(value: ParkingSpot | null, requestPermission = false, force = false, startIfMissing = false) {
    const status = await syncParkingUpdates(value, { requestPermission, force, startIfMissing });
    if (status !== 'superseded') setLiveStatus(status);
  }
  async function showParkingUpdate() { await updateCard(latestSpot.current, true, true, true); }
  async function readSavedSpot() {
    return AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { const saved = parseSpot(raw); canReconcile.current = true; latestSpot.current = saved; setSpot(saved); setLoadError(''); void updateCard(saved); })
      .catch(() => { canReconcile.current = false; setLoadError('Your saved spot could not be loaded. Retry before saving a new one.'); })
      .finally(() => { setLoading(false); });
  }
  useEffect(() => { void readSavedSpot();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active' && canReconcile.current) void updateCard(latestSpot.current); });
    return () => subscription.remove();
  // Initial loading and AppState reconciliation use the latest ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function reload() {
    setLoading(true);
    await readSavedSpot();
  }
  async function persist(value: ParkingSpot | null) {
    if (writing.current) throw new Error('A save is already in progress.');
    writing.current = true;
    try {
      if (value) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else await AsyncStorage.removeItem(STORAGE_KEY);
      const isNew = !!value && latestSpot.current?.savedAt !== value.savedAt;
      latestSpot.current = value;
      setSpot(value);
      void updateCard(value, isNew, false, isNew);
      setLoadError('');
    } finally { writing.current = false; }
  }
  return <Context.Provider value={{ spot, loading, loadError, liveStatus, showParkingUpdate, persist, reload }}>{children}</Context.Provider>;
}
export function useParking() {
  const context = useContext(Context);
  if (!context) throw new Error('ParkingProvider is missing');
  return context;
}
