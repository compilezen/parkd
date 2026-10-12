import { Platform, PermissionsAndroid } from 'react-native';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import { createUpdateCoordinator, parkingUpdate, type LiveUpdateStatus, type SyncOptions } from './live-update-model';
import type { ParkingSpot } from './parking';

type AndroidUpdates = {
  show: (spotId: number, title: string, body: string, compact: string, returning: boolean, force: boolean) => Promise<LiveUpdateStatus>;
  clear: () => Promise<void>;
};
const android = Platform.OS === 'android' && !isRunningInExpoGo()
  ? requireOptionalNativeModule<AndroidUpdates>('ParkdLiveUpdates') : null;

const ios = Platform.OS === 'ios' && !isRunningInExpoGo() && !!requireOptionalNativeModule('ExpoWidgets');
export function supportsParkingUpdates(): boolean { return !!android || ios; }

async function writeUpdate(spot: ParkingSpot | null, options: SyncOptions, isCurrent: () => boolean): Promise<LiveUpdateStatus> {
  if (ios) {
    const { writeIosUpdate } = await import('./parking-widgets');
    if (!isCurrent()) return 'superseded';
    return writeIosUpdate(spot, options);
  }
  if (!android) return 'unavailable';
  if (!spot) { await android.clear(); return 'off'; }
  if (Number(Platform.Version) >= 33 && options.requestPermission) {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (!granted) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  if (!isCurrent()) return 'superseded';
  const update = parkingUpdate(spot);
  return android.show(update.spotId, update.title, update.body, update.compact, update.returning, !!options.force);
}
export const syncParkingUpdates = createUpdateCoordinator(writeUpdate);
