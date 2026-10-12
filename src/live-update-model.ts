import { describeSpot, returnSteps, type ParkingSpot } from './parking.ts';

export type LiveUpdateStatus = 'off' | 'active' | 'denied' | 'hidden' | 'unavailable' | 'error' | 'superseded';
export type SyncOptions = { requestPermission?: boolean; force?: boolean; startIfMissing?: boolean };
export type ParkingUpdate = {
  spotId: number; title: string; body: string; compact: string;
  returning: boolean; step: number; stepCount: number;
};
export function currentReturnStep(spot: ParkingSpot): number {
  return Math.min(Math.max(0, spot.returnStep ?? 0), Math.max(0, returnSteps(spot).length - 1));
}
export function parkingUpdate(spot: ParkingSpot): ParkingUpdate {
  const steps = returnSteps(spot);
  const step = currentReturnStep(spot);
  const returning = !!spot.returning && steps.length > 0;
  const summary = describeSpot(spot);
  return {
    spotId: spot.savedAt,
    title: returning ? 'parkd · Your way back' : 'parkd · Parking saved',
    body: returning
      ? `Step ${step + 1} of ${steps.length}: ${steps[step].title}\n${summary}`
      : `${summary}\n${spot.entrance?.trim() ? `Return via ${spot.entrance.trim()}` : 'Tap to find your car.'}`,
    compact: Array.from(spot.floor.trim() || spot.zone.trim() || 'parkd').slice(0, 7).join(''),
    returning, step, stepCount: steps.length,
  };
}

export type UpdateAdapter = (spot: ParkingSpot | null, options: SyncOptions, isCurrent: () => boolean) => Promise<LiveUpdateStatus>;
// Serial native calls plus a freshness guard prevent a delayed permission prompt
// or update from restoring a notification after the spot was cleared.
export function createUpdateCoordinator(adapter: UpdateAdapter) {
  let generation = 0;
  let tail: Promise<LiveUpdateStatus> = Promise.resolve('off');
  return (spot: ParkingSpot | null, options: SyncOptions = {}) => {
    const ownGeneration = ++generation;
    const isCurrent = () => generation === ownGeneration;
    const job = tail.then(async (): Promise<LiveUpdateStatus> => {
      if (!isCurrent()) return 'superseded';
      try { const status = await adapter(spot, options, isCurrent); return isCurrent() ? status : 'superseded'; }
      catch { return 'error'; }
    });
    tail = job;
    return job;
  };
}
