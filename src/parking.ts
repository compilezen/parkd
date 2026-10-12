import { t } from './i18n/engine.ts';
export type ParkingSpot = {
  version: 1;
  savedAt: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  floor: string;
  zone: string;
  note: string;
  photo?: string;
  entrance?: string;
  lift?: string;
  space?: string;
  returning?: boolean;
  returnStep?: number;
};

export const STORAGE_KEY = 'parkd.spot.v1';

export function parseSpot(raw: string | null): ParkingSpot | null {
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Number.isFinite(value.savedAt) ||
      typeof value.floor !== 'string' || typeof value.zone !== 'string' ||
      typeof value.note !== 'string' ||
      (value.returning !== undefined && typeof value.returning !== 'boolean') ||
      (value.returnStep !== undefined && (!Number.isInteger(value.returnStep) || value.returnStep < 0 || value.returnStep > 2)) ||
      ['entrance', 'lift', 'space'].some(key => value[key] !== undefined && typeof value[key] !== 'string') ||
      (value.photo !== undefined && typeof value.photo !== 'string') ||
      (value.accuracy !== undefined && (!Number.isFinite(value.accuracy) || value.accuracy < 0)) ||
      ((value.latitude === undefined) !== (value.longitude === undefined)) ||
      (value.latitude !== undefined && (!Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90)) ||
      (value.longitude !== undefined && (!Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180))) {
    throw new Error('Saved parking data could not be read.');
  }
  return value;
}

export function newSpot(coordinates?: { latitude: number; longitude: number; accuracy: number | null }): ParkingSpot {
  return {
    version: 1, savedAt: Date.now(), floor: '', zone: '', note: '',
    ...(coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude,
      ...(coordinates.accuracy == null ? {} : { accuracy: coordinates.accuracy }) } : {}),
  };
}

export function mapsUrl(spot: ParkingSpot, platform: string): string | null {
  if (spot.latitude === undefined || spot.longitude === undefined) return null;
  const point = `${spot.latitude},${spot.longitude}`;
  if (platform === 'android') return `geo:0,0?q=${point}(${encodeURIComponent(t('Parked car'))})`;
  if (platform === 'ios') return `https://maps.apple.com/?ll=${point}&q=${encodeURIComponent(t('Parked car'))}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point)}`;
}

export async function openParkingPin(spot: ParkingSpot, platform: string, open: (url: string) => Promise<unknown>): Promise<void> {
  const url = mapsUrl(spot, platform);
  if (!url) throw new Error('No saved GPS pin');
  try { await open(url); }
  catch (error) {
    const fallback = mapsUrl(spot, 'web')!;
    if (fallback === url) throw error;
    await open(fallback);
  }
}

export function returnSteps(spot: ParkingSpot): { title: string; detail: string }[] {
  const steps = [];
  if (spot.entrance?.trim()) steps.push({ title: t('Go to {landmark}', { landmark: spot.entrance.trim() }), detail: t('Start at the landmark you saved.') });
  if (spot.floor.trim() || spot.lift?.trim()) steps.push({
    title: spot.floor.trim() ? t('Go to floor {floor}', { floor: spot.floor.trim() }) : t('Find {lift}', { lift: spot.lift!.trim() }),
    detail: spot.lift?.trim() ? t('Use {lift}.', { lift: spot.lift.trim() }) : t('Use the lift or stairs you came from.'),
  });
  const bay = [spot.zone.trim() && t('Zone {value}', { value: spot.zone.trim() }), spot.space?.trim() && t('Space {value}', { value: spot.space.trim() })].filter(Boolean).join(' · ');
  if (bay || spot.photo || spot.note.trim()) steps.push({ title: bay || t('Find your car'), detail: spot.note.trim() || (spot.photo ? t('Match the parking photo below.') : t('Look for your saved parking space.')) });
  return steps;
}

export function describeSpot(spot: ParkingSpot): string {
  return [spot.floor && t('Floor {value}', { value: spot.floor }), spot.zone && t('Zone {value}', { value: spot.zone }), spot.space && t('Space {value}', { value: spot.space })].filter(Boolean).join(' · ') || t('Your saved parking spot');
}
