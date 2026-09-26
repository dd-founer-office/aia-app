/**
 * Distant Devotion Content Intelligence — Shared Types
 * ----------------------------------------------------------------------------
 * Internal editorial/strategic metadata for the Distant Devotion content
 * system, validated across four holdout rounds (v1.0 test-drive, v1.1 20-run
 * validation, v1.2/v1.2.1 Safety Override holdout, v1.3 combined FLP holdout)
 * before this code existed. Nothing here is speculative -- every enum member
 * and rule below traces to one of those holdouts. None of it is exposed
 * publicly: the four WORLDS are the only public-facing taxonomy: LANGUAGE /
 * VALUES / PRACTICES / MEMORY. Everything else in this file is strategic
 * intelligence that shapes generation without ever being named in a caption.
 *
 * Generation itself is NOT an API call from this app (per explicit product
 * direction: no external API key, no server-side LLM integration). This
 * system instead compiles a complete prompt (see prompt-compiler.ts) that a
 * human copies into an external chat model, then pastes the model's response
 * back in (see response-parser.ts) for this app's OWN deterministic
 * validation (see validation.ts) before any asset composition happens. The
 * validation layer never trusts the pasted response's own status/safety
 * fields at face value -- it re-derives them from the source library and the
 * locked safety hierarchy, and can only make an asset MORE restricted than
 * what was pasted, never less.
 */

/** The four public-facing content worlds. Fixed at four -- never add a
 *  fifth. Network is a cross-cutting storytelling dimension (see
 *  NetworkRelationship below), not a fifth world; a network-rich asset still
 *  reports the WORLD it is actually about. */
export type WorldId = "LANGUAGE" | "VALUES" | "PRACTICES" | "MEMORY";

export const WORLD_IDS: readonly WorldId[] = ["LANGUAGE", "VALUES", "PRACTICES", "MEMORY"];

export const WORLD_LABELS: Record<WorldId, string> = {
  LANGUAGE: "Language",
  VALUES: "Values",
  PRACTICES: "Practices",
  MEMORY: "Memory",
};

/** Internal strategic function, never public. BELIEVE/LIVE/CREATE are NOT a
 *  second set of content pillars -- see the doc comment above. Selected
 *  because it genuinely fits the brief; never quota-rotated (v1.3 Section
 *  B/C validated non-mechanical selection at BELIEVE 6 / LIVE 3 / CREATE 6
 *  across 15 runs, with the two unused Practices cells fully explained by
 *  that holdout's own brief allocation, not by avoidance). */
export type FlpLens = "BELIEVE" | "LIVE" | "CREATE";

export const FLP_LENS_DESCRIPTIONS: Record<FlpLens, string> = {
  BELIEVE: "Family Language Beliefs / Ideologies — why does Tamil/heritage matter?",
  LIVE: "Family Language Practices — where/how does it naturally happen?",
  CREATE: "Family Language Management — what intentional opportunity can the family create?",
};

/** The strategic outcome ladder. Internal only, never a public pillar. Not
 *  forced when content is genuinely informational or safety-capped (v1.3
 *  Section D found this outcome decorative in ~2/15 runs, concentrated
 *  exactly there -- accepted as a known, narrow, non-blocking limitation). */
export type DesiredOutcome = "CONNECTION" | "BELONGING" | "IDENTITY" | "CONTINUITY";

/** Replaces the retired SUBJECT/EXPERIENCE/RELATIONSHIP register (v1.3
 *  Section F: it never diverged from this exact distinction across 15 runs,
 *  so per that holdout's own pre-committed rule, it was retired rather than
 *  kept "because it sounds useful theoretically"). SAFETY_CAPPED is new in
 *  this production model, added after v1.3 Section E found a capped asset
 *  fits neither of the other three values. */
export type Treatment = "INFORMATION_FIRST" | "FAMILY_MOMENT_FIRST" | "BOTH" | "SAFETY_CAPPED";

/** AUTO is the default and the only mode most users will ever pick -- the
 *  compiled prompt asks the model to choose from the brief, matching v1.3
 *  Section G's finding that blind, brief-dependent selection produces a
 *  reasonable (not perfectly even, not quota-forced) spread. */
export type ContentMode = "AUTO" | "TEACH" | "FEEL" | "REFLECT" | "PRACTISE" | "PARTICIPATE";

export const CONTENT_MODES: readonly ContentMode[] = [
  "AUTO",
  "TEACH",
  "FEEL",
  "REFLECT",
  "PRACTISE",
  "PARTICIPATE",
];

/** Source-safety classification -- locked, preserved verbatim from every
 *  prior holdout. NAMED_CULTURAL_PRACTICE requires standing verification
 *  (routes toward NEEDS_REVIEW) independent of whether the receiver-action
 *  check itself passes; VERIFIED_SOURCE_CONTENT is citation-backed (the
 *  Aathichoodi/Thirukkural corpus already in this codebase); UNIVERSAL_
 *  HUMAN_SCENARIO asserts no specific cultural-practice claim at all. */
export type CulturalClaimType =
  | "UNIVERSAL_HUMAN_SCENARIO"
  | "NAMED_CULTURAL_PRACTICE"
  | "VERIFIED_SOURCE_CONTENT";

/** PRACTICES-world only. NOT_APPLICABLE for the other three worlds.
 *  NEEDS_REVIEW_FOR_SPECIFICITY is the Safety Override's mechanical exit --
 *  it fires whenever a receiver action above OBSERVED would require
 *  inventing unverified specificity, and it is never bypassed by a forced
 *  PASS. Validated firing for real on kolam (v1.2.1) and choru (v1.3, first
 *  exposure), and NOT firing (safe self-correction) on filter coffee and
 *  feeding guests (both holdouts). */
export type PracticeSafetyResolution =
  | "SAFE_ACTION"
  | "NEEDS_REVIEW_FOR_SPECIFICITY"
  | "NOT_APPLICABLE";

export type DdStatus = "READY_TO_EDIT" | "NEEDS_REVIEW";

export type ReviewReason =
  | "RECEIVER_ACTION_REQUIRES_UNVERIFIED_SPECIFICITY"
  | "CULTURAL_PRACTICE_REQUIRES_SOURCE_VERIFICATION"
  | "INSUFFICIENT_SOURCE_SUPPORT";

/** User-facing output format. "reel"/"story" are aspect-ratio export
 *  variants of the same slide content as "carousel" (this codebase renders
 *  no video anywhere; a Reel here is a static cover image at Reel/Story
 *  dimensions, matching how the existing Aathichoodi Carousel already reuses
 *  one slide's content across instagram-post/instagram-story/facebook-post).
 *  "single-image" is its own, denser single-card layout, not a 1-slide
 *  excerpt of the carousel. */
export type DdFormat = "reel" | "carousel" | "story" | "single-image";

export interface NetworkRelationship {
  /** Free text, e.g. "Grandmother", "Parent", "Sibling", "Family (unnamed)". */
  transmitter: string;
  /** Free text, e.g. "Grandchild", "Child", "Sibling". */
  receiver: string;
  /** Short label for the relationship shape, e.g. "Grandmother→Grandchild",
   *  "Sibling↔Sibling", "multi-hop", "multidirectional", "bidirectional". */
  relationship: string;
  secondaryInfluencers?: string;
  /** One sentence of scene/context -- kept here rather than only in the
   *  public copy so the Editorial Intelligence panel can show it even when
   *  the public asset only implies it. */
  context?: string;
  /** How the content moves: observation, conversation, action, ritual,
   *  story, voice, memory, shared practice, digital message, gift,
   *  documentation. Free text, not a closed enum -- the validated holdouts
   *  used varied, specific phrasing here rather than a fixed short list. */
  transmissionMechanism: string;
}

/** The public-facing content an asset actually publishes. Every field here
 *  is what a reader sees; nothing in DdMetadata (below) ever surfaces here. */
export interface DdPublicContent {
  hook: string;
  /** The body/story/scene. For PRACTICES assets capped by the Safety
   *  Override, this is the safe, OBSERVED-level fragment -- see
   *  treatment: "SAFETY_CAPPED". */
  body: string;
  /** Omitted (not empty-string) when treatment is SAFETY_CAPPED or the
   *  asset is otherwise not yet cleared to publish -- a flagged asset does
   *  not get a public call to action. */
  cta?: string;
  hashtags?: readonly string[];
  captionOpener?: string;
  captionCloser?: string;
}

/** Internal-only strategic + safety metadata. Never rendered publicly; the
 *  Editorial Intelligence panel is the only UI surface that shows this. */
export interface DdMetadata {
  contentSystem: "DISTANT_DEVOTION";
  world: WorldId;
  /** Human-readable description of the source used (a specific Aathichoodi/
   *  Thirukkural line, a named Family Ritual unit, or "no citation --
   *  universal scenario"). */
  source: string;
  sourceUnitId?: string;
  flpLens: FlpLens;
  network: NetworkRelationship;
  desiredOutcome: DesiredOutcome;
  treatment: Treatment;
  contentMode: Exclude<ContentMode, "AUTO">;
  culturalClaimType: CulturalClaimType;
  practiceSafetyResolution: PracticeSafetyResolution;
  status: DdStatus;
  reviewReason?: ReviewReason;
  sourceReuseCount: number;
  sourcePoolStatus: string;
}

export interface DdComposedAsset {
  metadata: DdMetadata;
  content: DdPublicContent;
}
