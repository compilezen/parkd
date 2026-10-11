import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { parseSpot, STORAGE_KEY, type ParkingSpot } from './parking';

type Store = {
  spot: ParkingSpot | null; loading: boolean; loadError: string;
  persist: (value: ParkingSpot | null) => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function ParkingProvider({ children }: { children: ReactNode }) {
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const writing = useRef(false);
  async function readSavedSpot() {
    return AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { setSpot(parseSpot(raw)); setLoadError(''); })
      .catch(() => { setLoadError('Your saved spot could not be loaded. Retry before saving a new one.'); })
      .finally(() => { setLoading(false); });
  }
  useEffect(() => { void readSavedSpot(); }, []);
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
      setSpot(value);
      setLoadError('');
    } finally { writing.current = false; }
  }
  return <Context.Provider value={{ spot, loading, loadError, persist, reload }}>{children}</Context.Provider>;
}
export function useParking() {
  const context = useContext(Context);
  if (!context) throw new Error('ParkingProvider is missing');
  return context;
}
