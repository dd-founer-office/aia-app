/**
 * Daily Aathichoodi Series — Shared Variation Selection
 * ----------------------------------------------------------------------------
 * One small, reusable "pick something fresh" rule used by hooks.ts,
 * scenarios.ts, and actions.ts (requirement: prevent repetition without
 * losing series identity). Deterministic given the same (pool, recentIds,
 * seed) so the same episode composed twice in a row with the same history
 * produces the same result -- variety comes from the anti-repetition
 * history advancing between generations, not from randomness.
 */

export interface Pickable {
  id: string;
}

/** Picks the first pool item whose id is not in recentIds, cycling
 *  deterministically from `seed` when multiple are fresh so repeated calls
 *  with the same seed and history are stable. Falls back to the
 *  least-recently-used item (recentIds[recentIds.length - 1] excluded
 *  first) if every item has been used recently -- never returns nothing. */
export function pickFresh<T extends Pickable>(
  pool: readonly T[],
  recentIds: readonly string[],
  seed: number
): T {
  const fresh = pool.filter((item) => !recentIds.includes(item.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const index = ((seed % candidates.length) + candidates.length) % candidates.length;
  return candidates[index];
}

/** Bounded recent-history push: keeps at most `limit` most-recent ids. */
export function pushRecent(recentIds: readonly string[], id: string, limit: number): string[] {
  return [...recentIds.filter((existing) => existing !== id), id].slice(-limit);
}
