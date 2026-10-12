import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSpot } from '../src/parking.ts';
import { createUpdateCoordinator, parkingUpdate, currentReturnStep } from '../src/live-update-model.ts';

test('a parked spot is a normal card; active return shows the current saved step', () => {
  const spot = { ...newSpot(), floor: 'B1', zone: 'X', space: '142', entrance: 'Bershka' };
  assert.equal(parkingUpdate(spot).returning, false);
  assert.match(parkingUpdate(spot).body, /Zone X · Space 142/);
  assert.equal(parkingUpdate(spot).compact, 'B1');
  const returning = { ...spot, returning: true, returnStep: 1 };
  assert.equal(parkingUpdate(returning).returning, true);
  assert.match(parkingUpdate(returning).body, /Step 2 of 3: Go to floor B1/);
  assert.equal(currentReturnStep({ ...newSpot(), returnStep: 2 }), 0);
  assert.equal(parkingUpdate({ ...newSpot(), returning: true }).returning, false);
});

test('a delayed permission result cannot show a spot after it has been cleared', async () => {
  let release!: () => void;
  let began!: () => void;
  const started = new Promise<void>(resolve => { began = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const posted: string[] = [];
  const sync = createUpdateCoordinator(async (spot, _options, isCurrent) => {
    if (spot) { began(); await gate; if (!isCurrent()) return 'superseded'; posted.push('show'); return 'active'; }
    posted.push('clear'); return 'off';
  });
  const save = sync(newSpot(), { requestPermission: true });
  await started;
  const clear = sync(null);
  release();
  assert.equal(await save, 'superseded');
  assert.equal(await clear, 'off');
  assert.deepEqual(posted, ['clear']);
});

test('a failed native update does not poison later updates; queued old edits are skipped', async () => {
  const values: string[] = [];
  const sync = createUpdateCoordinator(async spot => {
    if (!spot) throw Error('Native failure');
    values.push(spot.floor); return 'active';
  });
  assert.equal(await sync(null), 'error');
  const a = sync({ ...newSpot(), floor: 'B1' });
  const b = sync({ ...newSpot(), floor: 'B2' });
  assert.equal(await a, 'superseded');
  assert.equal(await b, 'active');
  assert.deepEqual(values, ['B2']);
});
