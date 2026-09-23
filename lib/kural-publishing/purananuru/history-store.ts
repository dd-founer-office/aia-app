/**
 * Purananuru — Generation History (anti-repetition state)
 * ----------------------------------------------------------------------------
 * Own, fully separate localStorage key from aathichoodi/history-store.ts —
 * "Generate Next Poem" must never disturb the Daily Aathichoodi Series'
 * history, and vice versa. Same client-side-only rationale as that module
 * (no database wired up for content generation in this app).
 *
 * Deliberately smaller than SeriesHistory: Phase 1 has no per-field
 * variation pools yet (hook/visualStoryDirection are curated directly on
 * each canon entry, not composed — see canon.ts and content-engine.ts), so
 * the only thing worth remembering is which poems were recently shown, for
 * "Generate Next Poem"'s pickFresh() call, and the running generation
 * count used as pickFresh's deterministic seed.
 */

"use client";

const STORAGE_KEY = "aia-purananuru-series-history-v1";
/** Kept below the current pool size (3) so pickFresh() always has at least
 *  one genuinely fresh candidate to choose from instead of immediately
 *  falling back to the full pool — see selection.ts's own fallback doc
 *  comment. Revisit upward as the Master Content Index grows past a
 *  handful of poems. */
const RECENT_LIMIT = 2;

export interface PurananuruHistory {
  lastPoemNumber: number;
  recentPoemIds: string[];
  /** Monotonic counter, bumped on every generation — used as pickFresh()'s
   *  deterministic seed so repeated "Generate Next Poem" clicks advance
   *  through the pool instead of (deterministically) landing on the same
   *  candidate every time. */
  generationCount: number;
}

export const EMPTY_HISTORY: PurananuruHistory = {
  lastPoemNumber: 0,
  recentPoemIds: [],
  generationCount: 0,
};

export function loadHistory(): PurananuruHistory {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_HISTORY;
    const parsed = JSON.parse(raw) as Partial<PurananuruHistory>;
    return { ...EMPTY_HISTORY, ...parsed };
  } catch {
    return EMPTY_HISTORY;
  }
}

export function saveHistory(history: PurananuruHistory): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable (private browsing, quota) -- history just won't persist */
  }
}

export function clampRecentPoemIds(ids: readonly string[]): string[] {
  return ids.slice(-RECENT_LIMIT);
}
