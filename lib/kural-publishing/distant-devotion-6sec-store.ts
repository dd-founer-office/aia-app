/**
 * Distant Devotion — 6-Second Story: Persistence
 * ----------------------------------------------------------------------------
 * Same localStorage-only pattern as every other piece of state in this
 * feature (see aathichoodi/history-store.ts, aathichoodi-carousel-design-
 * store.ts) -- no database, no API route. Its own storage key, so a draft
 * here never collides with, reads from, or is overwritten by AiA/KKA/the
 * existing Distant Devotion system's own persisted state.
 *
 * One current draft, not a per-item collection -- this format's own user
 * flow (pillar -> topic -> two lines -> photo -> credit -> caption ->
 * preview -> download) is a single working story at a time, same shape as
 * how familyImageDataUrl persists the one photo currently being worked on.
 */

"use client";

import type { SixSecondStory } from "./distant-devotion-6sec-types";
import { DEFAULT_SIX_SECOND_STORY } from "./distant-devotion-6sec-types";

const STORAGE_KEY = "dd-6sec-story-draft-v1";

export function loadSixSecondStory(): SixSecondStory {
  if (typeof window === "undefined") return DEFAULT_SIX_SECOND_STORY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SIX_SECOND_STORY;
    const parsed = JSON.parse(raw) as Partial<SixSecondStory>;
    return { ...DEFAULT_SIX_SECOND_STORY, ...parsed };
  } catch {
    return DEFAULT_SIX_SECOND_STORY;
  }
}

export function saveSixSecondStory(story: SixSecondStory): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(story));
  } catch {
    /* storage unavailable (private browsing, quota) -- draft just won't persist */
  }
}
