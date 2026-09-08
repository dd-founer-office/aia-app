/**
 * Daily Aathichoodi Series — Generation History (anti-repetition state)
 * ----------------------------------------------------------------------------
 * This app has no database wired up for content generation (see
 * lib/supabase/* -- that's for a different feature, the Contributor App's
 * mission/evidence capture). So history is tracked client-side in
 * localStorage: recently used hook/scenario/action/child-lesson/aia-
 * connection/CTA ids, plus the last generated episode number (for "Generate
 * Next Episode"). Deliberately isolated behind this one small module so a
 * real per-user/server-side store can replace it later without touching
 * content-engine.ts's call sites.
 */

"use client";

const STORAGE_KEY = "aia-aathichoodi-series-history-v1";
const RECENT_LIMIT = 6;

export interface SeriesHistory {
  lastEpisodeNumber: number;
  recentHookIds: string[];
  recentScenarioIds: string[];
  recentActionIds: string[];
  recentChildLessonIds: string[];
  recentAiaConnectionIds: string[];
  recentCtaTypes: string[];
}

export const EMPTY_HISTORY: SeriesHistory = {
  lastEpisodeNumber: 0,
  recentHookIds: [],
  recentScenarioIds: [],
  recentActionIds: [],
  recentChildLessonIds: [],
  recentAiaConnectionIds: [],
  recentCtaTypes: [],
};

export function loadHistory(): SeriesHistory {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_HISTORY;
    const parsed = JSON.parse(raw) as Partial<SeriesHistory>;
    return { ...EMPTY_HISTORY, ...parsed };
  } catch {
    return EMPTY_HISTORY;
  }
}

export function saveHistory(history: SeriesHistory): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable (private browsing, quota) -- history just won't persist */
  }
}

export function clampRecent(ids: readonly string[]): string[] {
  return ids.slice(-RECENT_LIMIT);
}
