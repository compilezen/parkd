import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSpot, parseSpot, mapsUrl, describeSpot } from '../src/parking.ts';

test('a manual spot remains usable without GPS', () => {
  const spot = { ...newSpot(), floor: 'B2', zone: 'C14' };
  assert.deepEqual(parseSpot(JSON.stringify(spot)), spot);
  assert.equal(mapsUrl(spot, 'ios'), null);
  assert.equal(describeSpot(spot), 'Floor B2 · Zone C14');
});
test('zero coordinates are valid and navigation uses walking directions', () => {
  const spot = newSpot({ latitude: 0, longitude: 0, accuracy: 15 });
  assert.deepEqual(parseSpot(JSON.stringify(spot)), spot);
  assert.match(mapsUrl(spot, 'android')!, /destination=0,0&travelmode=walking/);
  assert.match(mapsUrl(spot, 'ios')!, /daddr=0,0&dirflg=w/);
});
test('malformed or out-of-range stored data is rejected', () => {
  assert.equal(parseSpot(null), null);
  for (const raw of ['{', '{}', JSON.stringify({ ...newSpot(), latitude: 200, longitude: 0 }),
    JSON.stringify({ ...newSpot(), latitude: 12 }), JSON.stringify({ ...newSpot(), photo: 12 })]) {
    assert.throws(() => parseSpot(raw));
  }
});
