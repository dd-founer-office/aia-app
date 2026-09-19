/**
 * Purananuru — Content Engine
 * ----------------------------------------------------------------------------
 * The Purananuru counterpart to lib/kural-publishing/aathichoodi/
 * content-engine.ts's composeEpisode: the one place preloaded canon data
 * becomes the shape the renderer/UI consumes. Reuses
 * aathichoodi/selection.ts's pickFresh()/pushRecent() directly (imported,
 * never copied) — that module is already generic and content-agnostic, so
 * duplicating it here would just be two copies of the same algorithm to
 * keep in sync. Nothing in aathichoodi/selection.ts is modified.
 *
 * Phase 1 scope: this dataset has only 3 poems and no per-field variation
 * pools yet (hook/visualStoryDirection are curated directly per poem on the
 * canon entry — see canon.ts). So composition here is intentionally a thin,
 * honest pass-through of canon + optional curated overrides, NOT a
 * pool-based generator like composeEpisode's. The seam for adding real
 * theme-pool composition later (mirroring hooks.ts/scenarios.ts/etc.) is
 * `buildComposedPoem`'s curated?.field ?? <fallback> pattern below — the
 * same shape composeEpisode already uses — so introducing pools later is an
 * addition to that pattern, not a rewrite of it.
 */

import {
  PURANANURU_CANON,
  getCanonEntry,
  type PurananuruCanonEntry,
} from "./canon";
import { purananuruThemeLabel, type PurananuruThemeId } from "./themes";
import { pickFresh, pushRecent, type Pickable } from "../aathichoodi/selection";
import type { CtaTypeId } from "../aathichoodi/cta";
import {
  clampRecentPoemIds,
  type PurananuruHistory,
} from "./history-store";

export interface ComposedPoem {
  poemNumber: number;
  totalPoems: number;
  poet: string;
  tamilText: string;
  simpleMeaning: string;
  coreAramTheme: PurananuruThemeId;
  themeLabel: string;
  hook: string;
  visualStoryDirection: string;
  /** Falls back to simpleMeaning when no curated.understanding/
   *  modernReflection is set — Phase 1 has no understanding.ts pool to
   *  compose one from, so an honest fallback beats fabricating prose. */
  understanding: string;
  /** undefined (not a fabricated empty string) when no curated field
   *  exists yet — the renderer/UI can decide whether to show the slide at
   *  all, rather than rendering a blank line. */
  modernReflection?: string;
  todayAction?: string;
  aiaConnection?: string;
  distantDevotionConnection?: string;
  recommendedCta?: CtaTypeId;
  verified: boolean;
  sourceUrl: string;
}

interface PoemPickable extends Pickable {
  poemNumber: number;
}

function poemPool(): PoemPickable[] {
  return PURANANURU_CANON.map((e) => ({ id: String(e.poemNumber), poemNumber: e.poemNumber }));
}

function buildComposedPoem(entry: PurananuruCanonEntry): ComposedPoem {
  const curated = entry.curated;
  return {
    poemNumber: entry.poemNumber,
    totalPoems: PURANANURU_CANON.length,
    poet: entry.poet,
    tamilText: entry.tamilText,
    simpleMeaning: entry.simpleMeaning,
    coreAramTheme: entry.coreAramTheme,
    themeLabel: purananuruThemeLabel(entry.coreAramTheme),
    hook: entry.hook,
    visualStoryDirection: entry.visualStoryDirection,
    understanding: curated?.understanding ?? curated?.modernReflection ?? entry.simpleMeaning,
    modernReflection: curated?.modernReflection,
    todayAction: curated?.todayAction,
    aiaConnection: curated?.aiaConnection,
    distantDevotionConnection: curated?.distantDevotionConnection,
    recommendedCta: curated?.recommendedCta,
    verified: entry.verified,
    sourceUrl: entry.sourceUrl,
  };
}

export interface ComposeResult {
  poem: ComposedPoem;
  nextHistory: PurananuruHistory;
}

/** Explicit "Load Poem #N" — direct lookup, no freshness/history logic,
 *  same convention as content-engine.ts's composeEpisode for a directly
 *  requested episode number. */
export function loadPoem(poemNumber: number, history: PurananuruHistory): ComposeResult | null {
  const entry = getCanonEntry(poemNumber);
  if (!entry) return null;
  return {
    poem: buildComposedPoem(entry),
    nextHistory: {
      lastPoemNumber: entry.poemNumber,
      recentPoemIds: clampRecentPoemIds(pushRecent(history.recentPoemIds, String(entry.poemNumber), 2)),
      generationCount: history.generationCount + 1,
    },
  };
}

/** "Generate Next Poem" — picks a fresh (not recently shown) preloaded
 *  poem via the shared pickFresh() picker, same anti-repetition pattern
 *  content-engine.ts's own selectHook/selectScenario/etc. use, just applied
 *  to the poem pool itself rather than a per-field variation pool (Phase 1
 *  has no such pools yet — see this file's own header). Always succeeds:
 *  pickFresh() falls back to the full pool once everything has been shown
 *  recently, so with the current 3-poem dataset this simply rotates
 *  through all three without ever repeating the immediately-previous one. */
export function generateNextPoem(history: PurananuruHistory): ComposeResult {
  const picked = pickFresh(poemPool(), history.recentPoemIds, history.generationCount);
  const entry = getCanonEntry(picked.poemNumber);
  // poemPool() is derived from PURANANURU_CANON itself, so this can only be
  // undefined if the canon array were empty -- not a real runtime case for
  // this dataset, but fall through to loadPoem's own null-safety rather
  // than assert.
  if (!entry) {
    return {
      poem: buildComposedPoem(PURANANURU_CANON[0]),
      nextHistory: history,
    };
  }
  return {
    poem: buildComposedPoem(entry),
    nextHistory: {
      lastPoemNumber: entry.poemNumber,
      recentPoemIds: clampRecentPoemIds(pushRecent(history.recentPoemIds, String(entry.poemNumber), 2)),
      generationCount: history.generationCount + 1,
    },
  };
}
