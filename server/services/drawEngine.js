/**
 * Pure draw logic - no database, no HTTP. Everything here is deterministic given
 * its inputs (except the RNG), so it is easy to unit test and safe to re-run for
 * simulations. All money is integer minor units (paise).
 */
export const SCORE_MIN = 1;
export const SCORE_MAX = 45;
export const PICK = 5;
export const TIERS = [5, 4, 3];

export function assertValidNumbers(numbers) {
  const ok =
    Array.isArray(numbers) &&
    numbers.length === PICK &&
    new Set(numbers).size === PICK &&
    numbers.every((n) => Number.isInteger(n) && n >= SCORE_MIN && n <= SCORE_MAX);
  if (!ok) throw new Error(`Draw numbers must be ${PICK} unique integers between ${SCORE_MIN} and ${SCORE_MAX}.`);
}

/** Standard lottery-style: 5 unique numbers, uniformly random. */
export function randomNumbers(rng = Math.random) {
  const pool = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => i + SCORE_MIN);
  const out = [];
  while (out.length < PICK) {
    const i = Math.floor(rng() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out.sort((a, b) => a - b);
}

/** How often each value appears across all supplied score lists. */
export function scoreFrequencies(scoreLists) {
  const freq = new Map();
  for (const list of scoreLists) for (const s of list) freq.set(s, (freq.get(s) || 0) + 1);
  return freq;
}

/**
 * Algorithmic draw: numbers that players log more often are more likely to be drawn.
 * weight = frequency + 1, so every number from 1-45 stays possible (smoothing).
 * Sampling is without replacement.
 */
export function weightedNumbers(freq, rng = Math.random) {
  const items = [];
  for (let n = SCORE_MIN; n <= SCORE_MAX; n++) items.push({ n, w: (freq.get(n) || 0) + 1 });
  const out = [];
  while (out.length < PICK) {
    const total = items.reduce((t, it) => t + it.w, 0);
    let r = rng() * total;
    let idx = items.length - 1;
    for (let i = 0; i < items.length; i++) {
      r -= items[i].w;
      if (r < 0) { idx = i; break; }
    }
    out.push(items.splice(idx, 1)[0].n);
  }
  return out.sort((a, b) => a - b);
}

/** Matches = how many drawn numbers appear among the player's scores (distinct values). */
export function countMatches(numbers, scores) {
  const s = new Set(scores);
  return numbers.reduce((c, n) => c + (s.has(n) ? 1 : 0), 0);
}

/** Monthly prize pool = sum of each active subscriber's monthly-equivalent fee x pool %. */
export function computePool(subscribers, poolPercent) {
  return subscribers.reduce((total, s) => {
    const monthly = s.price_minor / s.interval_months;
    return total + Math.floor((monthly * poolPercent) / 100);
  }, 0);
}

/** Split the pool into tiers by configured shares. The jackpot tier also receives any rollover. */
export function splitTiers(poolTotal, rolloverIn, shares) {
  const out = {};
  for (const t of TIERS) out[t] = Math.floor((poolTotal * (shares[t] ?? 0)) / 100);
  out[5] += rolloverIn;
  return out;
}

/**
 * Score every entry against the draw numbers and work out prizes.
 * - Tiers pay equally among all winners in the tier.
 * - Only the 5-match jackpot rolls over when nobody wins it.
 */
export function evaluate({ numbers, entries, tierPools }) {
  const scored = entries.map((e) => ({ ...e, matches: countMatches(numbers, e.scores) }));
  const tierSummary = {};
  const winners = [];
  for (const tier of TIERS) {
    const tierWinners = scored.filter((e) => e.matches === tier);
    const prizeEach = tierWinners.length ? Math.floor(tierPools[tier] / tierWinners.length) : 0;
    tierSummary[tier] = { pool: tierPools[tier], winners: tierWinners.length, prizeEach };
    for (const w of tierWinners) winners.push({ userId: w.userId, tier, amount: prizeEach });
  }
  const rolloverOut = tierSummary[5].winners === 0 ? tierPools[5] : 0;
  return { entries: scored, winners, tierSummary, rolloverOut };
}
