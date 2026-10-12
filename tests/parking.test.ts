import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSpot, parseSpot, mapsUrl, describeSpot, returnSteps, openParkingPin } from '../src/parking.ts';

test('a manual spot remains usable without GPS', () => {
  const spot = { ...newSpot(), floor: 'B2', zone: 'C14' };
  assert.deepEqual(parseSpot(JSON.stringify(spot)), spot);
  assert.equal(mapsUrl(spot, 'ios'), null);
  assert.equal(describeSpot(spot), 'Floor B2 · Zone C14');
});
test('zero coordinates are valid and Maps opens the saved pin', () => {
  const spot = newSpot({ latitude: 0, longitude: 0, accuracy: 15 });
  assert.deepEqual(parseSpot(JSON.stringify(spot)), spot);
  assert.match(mapsUrl(spot, 'android')!, /^geo:0,0\?q=0,0/);
  assert.match(mapsUrl(spot, 'ios')!, /ll=0,0&q=/);
});
test('malformed or out-of-range stored data is rejected', () => {
  assert.equal(parseSpot(null), null);
  for (const raw of ['{', '{}', JSON.stringify({ ...newSpot(), latitude: 200, longitude: 0 }),
    JSON.stringify({ ...newSpot(), latitude: 12 }), JSON.stringify({ ...newSpot(), photo: 12 })]) {
    assert.throws(() => parseSpot(raw));
  }
});


test('return steps use only saved clues and accept old records', () => {
  const old = newSpot();
  assert.deepEqual(returnSteps(parseSpot(JSON.stringify(old))!), []);
  const spot = { ...old, entrance: 'Bershka', lift: 'Blue lift', floor: 'B1', zone: 'X', space: '142' };
  assert.deepEqual(returnSteps(spot).map(s => s.title), ['Go to Bershka', 'Go to floor B1', 'Zone X · Space 142']);
  assert.equal(returnSteps(spot)[1].detail, 'Use Blue lift.');
  assert.equal(returnSteps({ ...old, entrance: 'Bershka' }).length, 1);
  assert.throws(() => parseSpot(JSON.stringify({ ...old, entrance: 123 })));
});

test('Maps opens once, falls back only on rejection, and reports total failure', async () => {
  const spot = newSpot({ latitude: 25.28, longitude: 51.53, accuracy: 10 });
  const calls: string[] = [];
  await openParkingPin(spot, 'android', async url => { calls.push(url); });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^geo:/);
  calls.length = 0;
  await openParkingPin(spot, 'android', async url => { calls.push(url); if (url.startsWith('geo:')) throw Error('No Maps app'); });
  assert.equal(calls.length, 2);
  assert.match(calls[1], /search\/\?api=1&query=25.28%2C51.53/);
  await assert.rejects(openParkingPin(spot, 'android', async () => { throw Error('Cannot open'); }));
  await assert.rejects(openParkingPin(newSpot(), 'android', async () => { assert.fail('must not open a missing pin'); }));
});
