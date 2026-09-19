/**
 * Purananuru Reel Storyboard — Content QA
 * ----------------------------------------------------------------------------
 * LOCKED BUILD. A deterministic, lightweight editorial contract for
 * reel-storyboard-content.ts's ComposedReelStoryboard -- NOT an AI
 * evaluator, no model calls, no judgment call a human couldn't verify in one
 * glance. Same convention every QA file in this codebase already uses: a
 * pure function returning `{ passed, messages }` with jargon-free messages
 * the UI can show as-is.
 *
 * Replaces reel-visual-story-qa.ts, reel-motion-direction-qa.ts, and
 * reel-teaching-direction-qa.ts (all three deleted) -- their own subjects
 * (ReelVisualScene, ReelMotionDirection, ReelTeachingDirection) no longer
 * exist under the locked-build architecture, so their checks would either
 * fail to compile or check nothing real. This file validates the new
 * seven-frame content model in one place instead of three, since all seven
 * frames now come from one flat ComposedReelStoryboard rather than several
 * semi-independent sub-objects.
 *
 * This module never reads or writes canon.ts, never calls an AI API, and is
 * read-only with respect to ComposedReelStoryboard -- it only inspects the
 * already-authored data in reel-storyboard-content.ts and reports on it.
 */

import type { ComposedReelStoryboard } from "./reel-storyboard-content";

export interface ReelContentQA {
  passed: boolean;
  messages: string[];
}

/** Same length floor reel-teaching-direction-qa.ts's own MIN_SUBSTANTIVE_
 *  LENGTH used: catches a one-word placeholder ("Generosity.") standing in
 *  for an actual explanation, without pretending to judge writing quality. */
const MIN_SUBSTANTIVE_LENGTH = 30;

/** A conversation hook / teaching question is meant to prompt a short
 *  real-life conversation, not read as a paragraph -- same discipline as
 *  every other short-text field elsewhere in this codebase. */
const MAX_CTA_LENGTH = 80;

/** Matches any Tamil-script codepoint (U+0B80–U+0BFF) -- the deterministic
 *  proxy this file uses for "is this field actually Tamil" / "does this
 *  English-narrative field accidentally contain Tamil script", per this
 *  project's own LANGUAGE ARCHITECTURE (English explains, Tamil carries
 *  heritage, Tanglish is pronunciation support only). */
const TAMIL_SCRIPT_PATTERN = /[஀-௿]/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function containsTamilScript(value: string): boolean {
  return TAMIL_SCRIPT_PATTERN.test(value);
}

/** Structural: every frame's field a human would actually read has real
 *  content. Defensive even though TypeScript already requires most of
 *  these fields -- matches the "check anyway" convention every QA file in
 *  this codebase already uses. */
function checkStructure(storyboard: ComposedReelStoryboard, messages: string[]): void {
  if (isBlank(storyboard.hook)) messages.push("Frame 1 (Parent Hook) has no hook text.");
  else if (storyboard.hook.trim().length < MIN_SUBSTANTIVE_LENGTH) {
    messages.push("Frame 1's hook reads like a fragment, not a real question or statement.");
  }

  if (isBlank(storyboard.modernSituation)) messages.push("Frame 2 (Modern Child Situation) has no content.");
  else if (storyboard.modernSituation.trim().length < MIN_SUBSTANTIVE_LENGTH) {
    messages.push("Frame 2's modern situation is too short to actually describe a situation.");
  }

  if (isBlank(storyboard.modernAction)) messages.push("Frame 3 (Human Action) has no content.");

  if (storyboard.livingTamilMoment) {
    const { tamil, english } = storyboard.livingTamilMoment;
    if (isBlank(tamil)) messages.push("The living Tamil moment is missing its Tamil phrase.");
    else if (!containsTamilScript(tamil)) messages.push("The living Tamil moment's \"tamil\" field doesn't actually contain Tamil script.");
    if (isBlank(english)) messages.push("The living Tamil moment is missing its English meaning.");
  }

  if (storyboard.excerptTamilLines.length === 0) messages.push("Frame 4 (Tamil Discovery) has no canonical Tamil excerpt.");
  if (isBlank(storyboard.discoveryIntro)) messages.push("Frame 4 is missing its English discovery intro.");
  if (isBlank(storyboard.discoveryMeaning)) messages.push("Frame 4 is missing its English meaning gloss.");

  if (isBlank(storyboard.aram.value)) messages.push("Frame 5 (Aram) is missing its named value.");
  if (isBlank(storyboard.aram.explanation)) messages.push("Frame 5's Aram explanation is empty.");
  else if (storyboard.aram.explanation.trim().length < MIN_SUBSTANTIVE_LENGTH) {
    messages.push("Frame 5's Aram explanation is too short to actually explain the value.");
  }

  if (isBlank(storyboard.teachingQuestion)) messages.push("Frame 6 (How To Teach) has no teaching question.");

  if (isBlank(storyboard.heritageStatement)) messages.push("Frame 7 (Practise / Pass It On) has no heritage statement.");
  if (isBlank(storyboard.cta.label)) messages.push("Frame 7's CTA is empty.");
  else if (storyboard.cta.label.trim().length > MAX_CTA_LENGTH) {
    messages.push("Frame 7's CTA reads like a paragraph, not a single call to action.");
  }
}

/** Language architecture: English is the primary narrative language --
 *  every English-narrative field must not accidentally BE Tamil script
 *  (the same mistake the old Frame 4 gloss made before this locked build);
 *  Tamil script is reserved for the canon excerpt and livingTamilMoment.
 *  tamil only. */
function checkLanguageArchitecture(storyboard: ComposedReelStoryboard, messages: string[]): void {
  const englishFields: readonly [string, string][] = [
    ["Frame 1's hook", storyboard.hook],
    ["Frame 2's modern situation", storyboard.modernSituation],
    ["Frame 3's human action", storyboard.modernAction],
    ["Frame 4's discovery intro", storyboard.discoveryIntro],
    ["Frame 4's meaning gloss", storyboard.discoveryMeaning],
    ["Frame 5's Aram explanation", storyboard.aram.explanation],
    ["Frame 6's teaching question", storyboard.teachingQuestion],
    ["Frame 7's heritage statement", storyboard.heritageStatement],
    ["Frame 7's CTA", storyboard.cta.label],
  ];

  for (const [label, value] of englishFields) {
    if (containsTamilScript(value)) {
      messages.push(`${label} contains Tamil script -- this field is meant to carry the English narrative, not the heritage language.`);
    }
  }

  if (storyboard.aram.value && containsTamilScript(storyboard.aram.value)) {
    messages.push("Frame 5's Aram value is in Tamil script -- use the English concept name unless a Tamil term is already verified in canon.ts.");
  }
}

/** Runs the full Content QA pass for one poem's already-composed Reel
 *  Storyboard. Deterministic and pure -- safe to call directly in a
 *  component's render body, same as buildComposedReelStoryboard itself. */
export function runReelContentQA(storyboard: ComposedReelStoryboard | null): ReelContentQA {
  if (!storyboard) {
    return { passed: false, messages: ["Reel content is not available for this poem yet."] };
  }

  const messages: string[] = [];

  checkStructure(storyboard, messages);
  checkLanguageArchitecture(storyboard, messages);

  return { passed: messages.length === 0, messages };
}
