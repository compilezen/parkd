import { t, isRTL } from './i18n/engine';
import { describeSpot } from './parking';
import { Platform, PermissionsAndroid } from 'react-native';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import { createUpdateCoordinator, parkingUpdate, type LiveUpdateStatus, type SyncOptions } from './live-update-model';
import type { ParkingSpot } from './parking';

type AndroidUpdates = {
  show: (spotId: number, title: string, body: string, compact: string, returning: boolean, force: boolean, labels: Record<string, string>) => Promise<LiveUpdateStatus>;
  clear: (labels: Record<string, string>) => Promise<void>;
  displayCapability: () => Promise<'old' | 'disabled' | 'supported'>;
  openDisplaySettings: () => Promise<void>;
  requestWidget: () => Promise<boolean>;
};
const android = Platform.OS === 'android' && !isRunningInExpoGo()
  ? requireOptionalNativeModule<AndroidUpdates>('ParkdLiveUpdates') : null;

const ios = Platform.OS === 'ios' && !isRunningInExpoGo() && !!requireOptionalNativeModule('ExpoWidgets');
export function supportsParkingUpdates(): boolean { return !!android || ios; }

export function supportsAndroidWidgets() { return !!android; }
export async function androidDisplayCapability() { return android?.displayCapability() ?? 'old'; }
export async function openAndroidDisplaySettings() { await android?.openDisplaySettings(); }
export async function requestAndroidWidget() { return await android?.requestWidget() ?? false; }
function labels(spot: ParkingSpot | null): Record<string, string> {
  const update = spot ? parkingUpdate(spot) : null;
  return { channel: t('Parking memory'), description: t('Your saved spot and the steps back to your car'),
    return: t('Your way back'), hide: t('Hide'), emptyTitle: t('One less thing to remember.'), emptyBody: t('Open parkd to save your spot.'),
    summary: spot ? describeSpot(spot) : '', rtl: String(isRTL()),
    widgetBody: update?.returning ? update.body.split('\n')[0] : spot?.entrance ? t('Return via {landmark}', { landmark: spot.entrance }) : t('Tap for your way back.'),
  };
}
async function writeUpdate(spot: ParkingSpot | null, options: SyncOptions, isCurrent: () => boolean): Promise<LiveUpdateStatus> {
  if (ios) {
    const { writeIosUpdate } = await import('./parking-widgets');
    if (!isCurrent()) return 'superseded';
    return writeIosUpdate(spot, options);
  }
  if (!android) return 'unavailable';
  if (!spot) { await android.clear(labels(null)); return 'off'; }
  if (Number(Platform.Version) >= 33 && options.requestPermission) {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (!granted) await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  if (!isCurrent()) return 'superseded';
  const update = parkingUpdate(spot);
  return android.show(update.spotId, update.title, update.body, update.compact, update.returning, !!options.force, labels(spot));
}
export const syncParkingUpdates = createUpdateCoordinator(writeUpdate);
