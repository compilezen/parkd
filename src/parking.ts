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
};

export const STORAGE_KEY = 'parkd.spot.v1';

export function parseSpot(raw: string | null): ParkingSpot | null {
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !Number.isFinite(value.savedAt) ||
      typeof value.floor !== 'string' || typeof value.zone !== 'string' ||
      typeof value.note !== 'string' ||
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
  if (platform === 'android') return `geo:0,0?q=${point}(Parked%20car)`;
  if (platform === 'ios') return `https://maps.apple.com/?ll=${point}&q=Parked%20car`;
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
  if (spot.entrance?.trim()) steps.push({ title: `Go to ${spot.entrance.trim()}`, detail: 'Start at the landmark you saved.' });
  if (spot.floor.trim() || spot.lift?.trim()) steps.push({
    title: spot.floor.trim() ? `Go to floor ${spot.floor.trim()}` : `Find ${spot.lift!.trim()}`,
    detail: spot.lift?.trim() ? `Use ${spot.lift.trim()}.` : 'Use the lift or stairs you came from.',
  });
  const bay = [spot.zone.trim() && `Zone ${spot.zone.trim()}`, spot.space?.trim() && `Space ${spot.space.trim()}`].filter(Boolean).join(' · ');
  if (bay || spot.photo || spot.note.trim()) steps.push({ title: bay || 'Find your car', detail: spot.note.trim() || (spot.photo ? 'Match the parking photo below.' : 'Look for your saved parking space.') });
  return steps;
}

export function describeSpot(spot: ParkingSpot): string {
  return [spot.floor && `Floor ${spot.floor}`, spot.zone && `Zone ${spot.zone}`, spot.space && `Space ${spot.space}`].filter(Boolean).join(' · ') || 'Your saved parking spot';
}
