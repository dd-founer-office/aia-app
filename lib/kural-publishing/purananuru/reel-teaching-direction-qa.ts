/**
 * Purananuru Reel Storyboard — Teaching Direction QA
 * ----------------------------------------------------------------------------
 * Teaching-First Content Revision. A deterministic, lightweight editorial
 * contract for reel-storyboard-content.ts's ReelTeachingDirection -- NOT an
 * AI evaluator, no model calls, no judgment call a human couldn't verify in
 * one glance. Sibling to reel-visual-story-qa.ts (Phase 8A) and
 * reel-motion-direction-qa.ts (Phase 9A), same convention: a pure function
 * over an already-composed ComposedReelStoryboard, returning
 * `{ passed, messages }` with jargon-free messages the UI can show as-is.
 *
 * This module never reads or writes canon.ts, never calls an AI API, and is
 * read-only with respect to ComposedReelStoryboard -- it only inspects the
 * already-authored data in reel-storyboard-content.ts and reports on it.
 */

import type { ComposedReelStoryboard, ReelStoryRole } from "./reel-storyboard-content";

export interface ReelTeachingDirectionQA {
  passed: boolean;
  messages: string[];
}

/** A conversation hook is meant to be one short question or line dropped
 *  into a conversation after the reel, not a paragraph -- mirrors
 *  reel-visual-story-qa.ts's own MAX_CAPTION_LENGTH convention of a small
 *  hard character budget rather than a word-count heuristic. */
const MAX_CONVERSATION_HOOK_LENGTH = 160;

/** A teaching moment / child relevance statement that reads as one short
 *  clause ("Sharing is good.") is exactly the textbook-definition register
 *  Part 4 of the brief calls out as the wrong one -- this is a length floor,
 *  not a quality judgment: it only catches the case a human glancing at the
 *  field would call "too short to be an actual explanation." */
const MIN_SUBSTANTIVE_LENGTH = 40;

/** Same situation/resolution role families reel-visual-story-qa.ts already
 *  enforces against sceneType -- redefined locally rather than imported,
 *  matching reel-motion-direction-qa.ts's own precedent of each QA file
 *  keeping its own small controlled vocabulary self-contained. */
const SITUATION_ROLES: ReadonlySet<ReelStoryRole> = new Set(["contrast", "tension"]);
const RESOLUTION_ROLES: ReadonlySet<ReelStoryRole> = new Set(["transformation", "resolution"]);

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Structural: every field a parent would actually read has real content,
 *  and isn't just the coreValue label repeated back at itself (a lazy
 *  "Generosity. Generosity is good." would technically fill every field
 *  without ever becoming a teaching moment). */
function checkStructure(storyboard: ComposedReelStoryboard, messages: string[]): void {
  const { teachingDirection } = storyboard;

  if (isBlank(teachingDirection.coreValue)) {
    messages.push("Teaching Direction is missing a core value.");
  }

  if (isBlank(teachingDirection.teachingMoment)) {
    messages.push("Teaching Direction is missing a teaching moment.");
  } else if (teachingDirection.teachingMoment.trim().length < MIN_SUBSTANTIVE_LENGTH) {
    messages.push("Teaching Direction's teaching moment reads like a slogan, not an explanation a parent could actually use.");
  } else if (teachingDirection.teachingMoment.trim().toLowerCase() === teachingDirection.coreValue.trim().toLowerCase()) {
    messages.push("Teaching Direction's teaching moment just repeats the core value -- it needs to say what the value actually means here.");
  }

  if (isBlank(teachingDirection.childRelevance)) {
    messages.push("Teaching Direction is missing a child relevance statement.");
  } else if (teachingDirection.childRelevance.trim().length < MIN_SUBSTANTIVE_LENGTH) {
    messages.push("Teaching Direction's child relevance statement is too short to actually connect to a child's life.");
  }

  if (teachingDirection.conversationHook !== undefined) {
    if (isBlank(teachingDirection.conversationHook)) {
      messages.push("Teaching Direction has a conversation hook field but it's empty -- omit the field entirely if there's no hook.");
    } else if (teachingDirection.conversationHook.trim().length > MAX_CONVERSATION_HOOK_LENGTH) {
      messages.push("Teaching Direction's conversation hook is too long -- it should be one short question or line, not a paragraph.");
    }
  }
}

/** Coherence with the poem's own Story Arc (Phase 8A): the teaching
 *  direction claims a "starting state -> value in action" transformation,
 *  so Frame 2 must actually be a situation-role scene and Frame 5 a
 *  resolution-role scene -- otherwise the teaching layer is describing a
 *  transformation the visual story doesn't actually show. */
function checkTransformationIsVisible(storyboard: ComposedReelStoryboard, messages: string[]): void {
  const { frame2Scene, frame5Scene } = storyboard;

  if (!SITUATION_ROLES.has(frame2Scene.storyRole)) {
    messages.push("Frame 2 isn't tagged as a starting-state scene, so the Teaching Direction's transformation has nothing to start from.");
  }
  if (!RESOLUTION_ROLES.has(frame5Scene.storyRole)) {
    messages.push("Frame 5 isn't tagged as a resolution scene, so the Teaching Direction's transformation has nothing to resolve into.");
  }
  if (isBlank(frame2Scene.emotionalMovement) && isBlank(frame5Scene.emotionalMovement)) {
    messages.push("Neither frame has an emotional movement -- the Teaching Direction can't be grounded in a visible transformation.");
  }
}

/** Runs the full Teaching Direction QA pass for one poem's already-composed
 *  Reel Storyboard. Deterministic and pure -- safe to call directly in a
 *  component's render body, same as runReelVisualStoryQA /
 *  runReelMotionDirectionQA. */
export function runReelTeachingDirectionQA(storyboard: ComposedReelStoryboard | null): ReelTeachingDirectionQA {
  if (!storyboard) {
    return { passed: false, messages: ["Teaching direction is not available for this poem yet."] };
  }

  const messages: string[] = [];

  checkStructure(storyboard, messages);
  checkTransformationIsVisible(storyboard, messages);

  return { passed: messages.length === 0, messages };
}
