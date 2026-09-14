/**
 * Aathichoodi Carousel — Design Overrides (client-side persistence)
 * ----------------------------------------------------------------------------
 * Same pattern as aathichoodi/history-store.ts: no database wired up for
 * this tool, so the live design-controls panel's edits are persisted to
 * localStorage, keyed per episode number so different episodes can carry
 * their own text overrides without clobbering each other, while style
 * overrides (colours/sizes/layout) are shared across all episodes -- they
 * describe the design SYSTEM, not one episode's content.
 */

"use client";

import type {
  CarouselDesignOverrides,
  CarouselPositions,
  CarouselStyleOverrides,
  CarouselTextEmphases,
  CarouselTextOverrides,
} from "./aathichoodi-carousel-renderer";

const STYLE_STORAGE_KEY = "aia-aathichoodi-carousel-style-v1";
const TEXT_STORAGE_KEY_PREFIX = "aia-aathichoodi-carousel-text-v1-";
// Drag positions and bold/italic toggles are shared across episodes, same
// as style -- they describe the design SYSTEM's layout, not one episode's
// content.
const POSITIONS_STORAGE_KEY = "aia-aathichoodi-carousel-positions-v1";
const EMPHASES_STORAGE_KEY = "aia-aathichoodi-carousel-emphases-v1";

export function loadStyleOverrides(): CarouselStyleOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STYLE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CarouselStyleOverrides) : {};
  } catch {
    return {};
  }
}

export function saveStyleOverrides(style: CarouselStyleOverrides): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(style));
  } catch {
    /* storage unavailable (private browsing, quota) -- edits just won't persist */
  }
}

export function loadTextOverrides(episodeNumber: number): CarouselTextOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${TEXT_STORAGE_KEY_PREFIX}${episodeNumber}`);
    return raw ? (JSON.parse(raw) as CarouselTextOverrides) : {};
  } catch {
    return {};
  }
}

export function saveTextOverrides(episodeNumber: number, text: CarouselTextOverrides): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${TEXT_STORAGE_KEY_PREFIX}${episodeNumber}`, JSON.stringify(text));
  } catch {
    /* storage unavailable -- edits just won't persist */
  }
}

export function loadPositions(): CarouselPositions {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(POSITIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CarouselPositions) : {};
  } catch {
    return {};
  }
}

export function savePositions(positions: CarouselPositions): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    /* storage unavailable (private browsing, quota) -- edits just won't persist */
  }
}

export function loadEmphases(): CarouselTextEmphases {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EMPHASES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CarouselTextEmphases) : {};
  } catch {
    return {};
  }
}

export function saveEmphases(emphases: CarouselTextEmphases): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EMPHASES_STORAGE_KEY, JSON.stringify(emphases));
  } catch {
    /* storage unavailable (private browsing, quota) -- edits just won't persist */
  }
}

export function buildDesignOverrides(
  style: CarouselStyleOverrides,
  text: CarouselTextOverrides,
  positions: CarouselPositions,
  emphases: CarouselTextEmphases
): CarouselDesignOverrides {
  return { style, text, positions, emphases };
}
