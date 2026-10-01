import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from './drawEngine.js';

test('randomNumbers returns 5 unique numbers in range', () => {
  for (let i = 0; i < 200; i++) {
    const n = e.randomNumbers();
    e.assertValidNumbers(n);
  }
});

test('weightedNumbers favours frequent scores and stays valid', () => {
  const freq = new Map([[10, 500]]);
  let hits = 0;
  for (let i = 0; i < 300; i++) {
    const n = e.weightedNumbers(freq);
    e.assertValidNumbers(n);
    if (n.includes(10)) hits++;
  }
  assert.ok(hits > 250, `expected 10 to be drawn very often, got ${hits}/300`);
});

test('countMatches uses distinct values', () => {
  assert.equal(e.countMatches([1, 2, 3, 4, 5], [1, 1, 2, 40, 41]), 2);
});

test('pool and tier split', () => {
  const pool = e.computePool([{ price_minor: 49900, interval_months: 1 }, { price_minor: 499900, interval_months: 12 }], 50);
  assert.equal(pool, Math.floor(49900 * 0.5) + Math.floor((499900 / 12) * 0.5));
  const tiers = e.splitTiers(1000, 200, { 5: 40, 4: 35, 3: 25 });
  assert.deepEqual(tiers, { 5: 600, 4: 350, 3: 250 });
});

test('evaluate splits equally and rolls the jackpot over when unclaimed', () => {
  const numbers = [1, 2, 3, 4, 5];
  const entries = [
    { userId: 'a', scores: [1, 2, 3, 40, 41] },
    { userId: 'b', scores: [1, 2, 3, 42, 43] },
    { userId: 'c', scores: [1, 2, 3, 4, 44] },
    { userId: 'd', scores: [9, 9, 9, 9, 9] },
  ];
  const r = e.evaluate({ numbers, entries, tierPools: { 5: 1000, 4: 300, 3: 200 } });
  assert.equal(r.tierSummary[3].winners, 2);
  assert.equal(r.tierSummary[3].prizeEach, 100);
  assert.equal(r.tierSummary[4].winners, 1);
  assert.equal(r.tierSummary[5].winners, 0);
  assert.equal(r.rolloverOut, 1000);
});

test('jackpot does not roll over when someone wins it', () => {
  const r = e.evaluate({
    numbers: [1, 2, 3, 4, 5],
    entries: [{ userId: 'a', scores: [1, 2, 3, 4, 5] }],
    tierPools: { 5: 900, 4: 0, 3: 0 },
  });
  assert.equal(r.rolloverOut, 0);
  assert.equal(r.winners[0].amount, 900);
});
