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
};

export const STORAGE_KEY = 'parkd.spot.v1';

export function parseSpot(raw: string | null): ParkingSpot | null {
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Number.isFinite(value.savedAt) ||
      typeof value.floor !== 'string' || typeof value.zone !== 'string' ||
      typeof value.note !== 'string' ||
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
  const destination = `${spot.latitude},${spot.longitude}`;
  return platform === 'ios'
    ? `https://maps.apple.com/?daddr=${destination}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
}

export function describeSpot(spot: ParkingSpot): string {
  return [spot.floor && `Floor ${spot.floor}`, spot.zone && `Zone ${spot.zone}`].filter(Boolean).join(' · ') || 'Your saved parking spot';
}
