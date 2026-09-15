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
  recentScenarioIds: string[];
  recentActionIds: string[];
  recentChildLessonIds: string[];
  recentAiaConnectionIds: string[];
  recentCtaTypes: string[];
  /** Slide 2's opening phrase ("Avvaiyar begins with a powerful idea:" and
   *  its paraphrases) -- tracked separately from the theme-specific
   *  reframing clause below it, since the opener pool is theme-independent. */
  recentUnderstandingOpenerIds: string[];
  /** Slide 2's per-theme "what this builds in a child" clause. */
  recentReframingIds: string[];
  /** Slide 1's hook (hooks.ts) -- per-episode now, not the old fixed line. */
  recentHookIds: string[];
  /** Slide 1's closing tagline (taglines.ts) -- per-episode now, not the
   *  old fixed "Small values today. / A kinder tomorrow." copy. */
  recentTaglineIds: string[];
  /** Caption's broad-reach hashtag (hashtags.ts) -- the brand and theme
   *  tags don't need anti-repetition (theme already rotates episode to
   *  episode; the brand tag is deliberately constant). */
  recentReachHashtagIds: string[];
  /** Caption-only copy (caption-copy.ts) -- deliberately its own pools,
   *  never the slide's own hook/tagline/CTA text, so the caption reads as
   *  a separate piece of writing rather than a copy of the graphic. */
  recentCaptionOpenerIds: string[];
  recentCaptionCloserIds: string[];
  recentCaptionCtaIds: string[];
}

export const EMPTY_HISTORY: SeriesHistory = {
  lastEpisodeNumber: 0,
  recentScenarioIds: [],
  recentActionIds: [],
  recentChildLessonIds: [],
  recentAiaConnectionIds: [],
  recentCtaTypes: [],
  recentUnderstandingOpenerIds: [],
  recentReframingIds: [],
  recentHookIds: [],
  recentTaglineIds: [],
  recentReachHashtagIds: [],
  recentCaptionOpenerIds: [],
  recentCaptionCloserIds: [],
  recentCaptionCtaIds: [],
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
