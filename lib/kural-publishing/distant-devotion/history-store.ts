/**
 * Distant Devotion — Generation History (reuse tracking)
 * ----------------------------------------------------------------------------
 * Client-side localStorage history, same pattern as
 * aathichoodi/history-store.ts. Tracks how many times each Practices source
 * unit has been used across this program (seeded with the real counts this
 * program's validation already established, so a fresh browser doesn't
 * silently understate reuse just because it never ran the earlier
 * holdouts), plus a light recent-selection log for FLP lens / content mode
 * so the Editorial Intelligence panel can show real recent-distribution
 * context. This history is informational only -- it never blocks
 * generation and never overrides the deterministic validator in
 * validation.ts, which reasons from riskClass alone, not from reuse count.
 */

"use client";

import type { FlpLens, ContentMode, WorldId } from "./types";

const STORAGE_KEY = "aia-distant-devotion-history-v1";
const RECENT_LIMIT = 12;

export interface DistantDevotionHistory {
  /** source_unit_id -> reuse count, established across this program's prior
   *  validation rounds. A fresh install starts from these real, already-
   *  documented counts rather than from zero, so reuse transparency stays
   *  honest even before this UI existed. */
  sourceReuseCounts: Record<string, number>;
  recentWorlds: WorldId[];
  recentFlpLenses: FlpLens[];
  recentContentModes: Exclude<ContentMode, "AUTO">[];
}

/** Counts as last documented in the v1.3 combined holdout (Section H/F).
 *  "lamp"/"pongal" start at 0 -- untested, not silently assumed used. */
export const SEEDED_SOURCE_REUSE_COUNTS: Record<string, number> = {
  "diwali-order": 6,
  kolam: 5,
  "filter-coffee": 6,
  "feeding-guests": 6,
  choru: 1,
  lamp: 0,
  pongal: 0,
};

export const EMPTY_HISTORY: DistantDevotionHistory = {
  sourceReuseCounts: { ...SEEDED_SOURCE_REUSE_COUNTS },
  recentWorlds: [],
  recentFlpLenses: [],
  recentContentModes: [],
};

export function loadDdHistory(): DistantDevotionHistory {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_HISTORY;
    const parsed = JSON.parse(raw) as Partial<DistantDevotionHistory>;
    return {
      ...EMPTY_HISTORY,
      ...parsed,
      sourceReuseCounts: {
        ...SEEDED_SOURCE_REUSE_COUNTS,
        ...(parsed.sourceReuseCounts ?? {}),
      },
    };
  } catch {
    return EMPTY_HISTORY;
  }
}

export function saveDdHistory(history: DistantDevotionHistory): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    /* storage unavailable -- history just won't persist */
  }
}

function clampRecent<T>(ids: readonly T[]): T[] {
  return ids.slice(-RECENT_LIMIT);
}

/** Records a completed, validated generation into history. Called once per
 *  successful parse+validate, not per prompt-compile (compiling a prompt
 *  doesn't guarantee the user ever pastes a response back). */
export function recordDdGeneration(
  history: DistantDevotionHistory,
  entry: { world: WorldId; flpLens: FlpLens; contentMode: Exclude<ContentMode, "AUTO">; sourceUnitId?: string }
): DistantDevotionHistory {
  const nextCounts = { ...history.sourceReuseCounts };
  if (entry.sourceUnitId) {
    nextCounts[entry.sourceUnitId] = (nextCounts[entry.sourceUnitId] ?? 0) + 1;
  }
  return {
    sourceReuseCounts: nextCounts,
    recentWorlds: clampRecent([...history.recentWorlds, entry.world]),
    recentFlpLenses: clampRecent([...history.recentFlpLenses, entry.flpLens]),
    recentContentModes: clampRecent([...history.recentContentModes, entry.contentMode]),
  };
}

export function getSourceReuseCount(history: DistantDevotionHistory, sourceUnitId: string): number {
  return history.sourceReuseCounts[sourceUnitId] ?? 0;
}
