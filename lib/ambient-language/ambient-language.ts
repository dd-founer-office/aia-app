/**
 * Ambient Language Layer v1.0 (MVP)
 * ----------------------------------------------------------------------------
 * "Please allow the field to gently express this word." That's the entire
 * contract with the Living Kernel. This layer decides WHETHER and WHAT;
 * the Kernel (lib/living-field/ambient-expression.ts) decides HOW. This
 * file never touches a canvas, a glyph position, an opacity value, or a
 * breathing calculation -- it only calls one Kernel method,
 * `engine.expressWord(graphemes)`, and only when it has decided the moment
 * is right.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS LIVES OUTSIDE lib/living-field/
 * ----------------------------------------------------------------------------
 * This is a peer of the Living Kernel, not a seventh internal engine. The
 * architectural goal diagram is explicit: Application Event -> Ambient
 * Language Layer -> Living Kernel -> Renderer. "Living Kernel" here is the
 * whole six-stage system treated as one unit this layer calls INTO -- not
 * a box to be spliced between Harmony and the Renderer. Living outside
 * lib/living-field/ makes that boundary a physical fact of the folder
 * structure, not just a documentation claim.
 *
 * ---------------------------------------------------------------------------
 * RESPONSIBILITIES HELD HERE, PER THE SPEC
 * ---------------------------------------------------------------------------
 * - Own the fixed MVP event -> Tamil word vocabulary.
 * - Segment a Tamil word/phrase into the same grapheme-cluster units the
 *   Kernel's glyph sets are built from (Intl.Segmenter, NOT naive
 *   per-codepoint splitting -- Tamil consonant+pulli and consonant+vowel-
 *   sign combinations are single atomic units in the 247-glyph set, and
 *   splitting by code point would break matching entirely).
 * - Prevent overlapping emergences and respect a cooldown between them
 *   (implemented as one unified timer -- see COOLDOWN_GAP_MS below).
 * - Respect prefers-reduced-motion by simply never firing a request in the
 *   first place, rather than asking the Kernel to handle a reduced-motion
 *   variant of an already-decorative effect.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS LAYER DOES NOT DO (non-responsibilities, verified by design)
 * ---------------------------------------------------------------------------
 * No import of anything from lib/living-field/ other than the engine
 * registry's two functions and one exported duration constant -- no
 * canvas, no glyph positions, no opacity, no breathing, no knowledge of
 * Affinity or Harmony. Verify this by import audit whenever this file
 * changes.
 */

import { getActiveLivingFieldEngine } from "@/lib/living-field/engine-registry";
import { EXPRESSION_TOTAL_DURATION_MS } from "@/lib/living-field/ambient-expression";
import type { AmbientLanguageEvent, NotifyEventOptions } from "./ambient-language-types";

/**
 * Minimal local type for Intl.Segmenter -- a real, standard, widely-
 * supported ECMA-402 API (all evergreen browsers, Node >= 16), but its
 * TypeScript type definitions only ship in the "ES2022.Intl" lib entry.
 * Rather than require this project's tsconfig.json to be updated to a
 * newer lib target (a separate file this task didn't otherwise need to
 * touch), this shim describes only the two members actually used below,
 * so the real runtime API is used exactly as-is regardless of which lib
 * version the rest of the project is configured against.
 */
interface MinimalSegmenter {
  segment(text: string): Iterable<{ segment: string }>;
}
interface MinimalIntlWithSegmenter {
  Segmenter: new (locale: string, options: { granularity: "grapheme" }) => MinimalSegmenter;
}

/** MVP vocabulary, per spec: exactly these six fixed words. "kuralSection"
 *  is intentionally absent here -- its phrase is supplied by the caller
 *  each time (see NotifyEventOptions.phrase), never hardcoded, since the
 *  actual daily Kural is already sourced elsewhere in the app and this
 *  layer must never invent or duplicate that content. */
const EVENT_WORD_MAP: Partial<Record<AmbientLanguageEvent, string>> = {
  appLaunch: "வணக்கம்",
  homeReady: "அறம்",
  treeMission: "மரம்",
  education: "கல்வி",
  food: "பகிர்வு",
  evidencePublished: "வாழ்க",
};

/** Minimum gap, in ms, between one expression fully finishing (rise + hold
 *  + fall complete) and the next being allowed to start. This single timer
 *  is what implements BOTH "prevent overlapping emergences" (a new request
 *  is rejected while the previous one is still visibly rising/holding/
 *  falling) AND "respect cooldowns" (an additional quiet gap after that) --
 *  they collapse into one check because both are really the same question:
 *  "has enough time passed since the last one fully ended?" Internal
 *  constant, tunable later; not exposed via any config surface yet. */
const COOLDOWN_GAP_MS = 45_000;

/** Timestamp (performance.now()-based, matching the Kernel's own clock)
 *  after which a new expression may be requested. `0` means "never
 *  requested yet, always allowed." Module-level by design: there is
 *  exactly one Ambient Language Layer for the whole application, the same
 *  way there is exactly one mounted Living Field at a time. */
let nextAllowedRequestTime = 0;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Segments a Tamil word/phrase into the same grapheme-cluster units the
 *  Kernel's 247-glyph modern Tamil set is built from. Uses Intl.Segmenter
 *  (standard, supported in all modern browsers and Node >= 16) rather than
 *  naive `[...string]` code-point iteration, which would incorrectly split
 *  a single combined unit like "க்" (consonant + pulli) into two separate
 *  code points that don't individually exist in the glyph set. Falls back
 *  to code-point splitting only if Intl.Segmenter is genuinely unavailable
 *  (should not happen in any realistically targeted environment); matching
 *  would simply find fewer/no cells in that fallback case rather than
 *  throwing, consistent with this layer's best-effort philosophy. */
export function segmentTamilGraphemes(text: string): string[] {
  const intlWithSegmenter = Intl as unknown as Partial<MinimalIntlWithSegmenter>;
  if (typeof intlWithSegmenter.Segmenter === "function") {
    const segmenter = new intlWithSegmenter.Segmenter("ta", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((s) => s.segment);
  }
  return [...text];
}

/**
 * The Ambient Language Layer's single entry point. Call sites elsewhere in
 * the application call this at meaningful moments (e.g. Home mounting,
 * app launch, a mission type being selected). Returns whether an
 * expression was actually requested -- `false` covers every gating reason
 * (reduced motion, cooldown/overlap, no mounted field, unknown event, or a
 * missing phrase for "kuralSection") without distinguishing which, since
 * none of those cases need different handling by the caller.
 */
export function notifyEvent(event: AmbientLanguageEvent, options: NotifyEventOptions = {}): boolean {
  if (prefersReducedMotion()) return false;

  const now = performance.now();
  if (now < nextAllowedRequestTime) return false;

  const phrase = event === "kuralSection" ? options.phrase : EVENT_WORD_MAP[event];
  if (!phrase) return false;

  const engine = getActiveLivingFieldEngine();
  if (!engine) return false;

  const graphemes = segmentTamilGraphemes(phrase);
  engine.expressWord(graphemes);

  nextAllowedRequestTime = now + EXPRESSION_TOTAL_DURATION_MS + COOLDOWN_GAP_MS;
  return true;
}
