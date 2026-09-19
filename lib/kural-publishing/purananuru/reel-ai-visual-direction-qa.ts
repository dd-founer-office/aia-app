/**
 * Purananuru Reel Storyboard — AI Visual Direction QA
 * ----------------------------------------------------------------------------
 * LOCKED BUILD. A deterministic, lightweight editorial contract for
 * reel-ai-visual-direction.ts's ComposedReelAIVisualDirection -- NOT an AI
 * evaluator, no model calls, no judgment call a human couldn't verify in one
 * read of the two prompts. Same convention every QA file in this codebase
 * already uses: a pure function returning `{ passed, messages }` with
 * jargon-free messages the UI can show as-is.
 *
 * Rewritten for the two-image architecture (image1/image2 instead of the
 * old frame2/frame5), and with the old checkSemanticConsistency check
 * removed entirely: it validated the AI direction against Phase 9A's
 * ReelMotionDirection.relationship, which no longer exists under the
 * locked-build architecture (there is no more abstract motion system to
 * stay consistent with). checkTeachingConnection is rebuilt against the
 * new reel-storyboard-content.ts fields (aram.value) instead of the old
 * ReelTeachingDirection.
 *
 * This module never reads or writes canon.ts, never calls an AI API, and is
 * read-only with respect to both ComposedReelAIVisualDirection and
 * ComposedReelStoryboard -- it only inspects already-composed data and
 * reports on it.
 */

import type { ComposedReelAIVisualDirection, ReelAIImageDirection } from "./reel-ai-visual-direction";
import type { ComposedReelStoryboard } from "./reel-storyboard-content";

export interface ReelAIVisualDirectionQA {
  passed: boolean;
  messages: string[];
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function hasWord(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** Structural: every field a prompt is built from actually has content.
 *  Defensive even though TypeScript already requires these fields --
 *  matches the same "check anyway" convention every QA file in this
 *  codebase already uses. */
function checkStructure(aiDirection: ComposedReelAIVisualDirection, messages: string[]): void {
  const { continuityBible } = aiDirection;

  if (continuityBible.characters.length === 0) {
    messages.push("The continuity bible has no characters defined.");
  }
  for (const character of continuityBible.characters) {
    if (isBlank(character.id)) messages.push("A character in the continuity bible is missing its id.");
    if (isBlank(character.role)) messages.push(`Character "${character.id || "?"}" is missing a role.`);
    if (isBlank(character.appearance)) messages.push(`Character "${character.id || "?"}" is missing an appearance description.`);
    if (isBlank(character.clothing)) messages.push(`Character "${character.id || "?"}" is missing a clothing description.`);
  }

  const env = continuityBible.environment;
  if (isBlank(env.location)) messages.push("The continuity bible's environment is missing a location.");
  if (isBlank(env.timeOfDay)) messages.push("The continuity bible's environment is missing a time of day.");
  if (isBlank(env.culturalContext)) messages.push("The continuity bible's environment is missing cultural context.");

  const style = continuityBible.visualStyle;
  if (isBlank(style.cameraLanguage)) messages.push("The continuity bible's visual style is missing camera language.");
  if (isBlank(style.lighting)) messages.push("The continuity bible's visual style is missing a lighting description.");

  if (continuityBible.recurringProps.length === 0) {
    messages.push("The continuity bible has no recurring props defined.");
  }

  if (isBlank(aiDirection.storyContextLine)) messages.push("The AI Visual Direction has no story context.");

  for (const [label, image] of [
    ["Image 1", aiDirection.image1],
    ["Image 2", aiDirection.image2],
  ] as const) {
    if (isBlank(image.purpose)) messages.push(`${label} doesn't say which frames it serves.`);
    if (isBlank(image.state)) messages.push(`${label}'s AI direction is missing a story-state description.`);
    if (isBlank(image.composition)) messages.push(`${label}'s AI direction is missing a composition description.`);
    if (isBlank(image.subjectAction)) messages.push(`${label}'s AI direction is missing a subject-action description.`);
    if (isBlank(image.emotionalTone)) messages.push(`${label}'s AI direction is missing an emotional tone.`);
    if (isBlank(image.prompt)) messages.push(`${label}'s AI image prompt is empty.`);
    if (isBlank(image.negativePrompt)) messages.push(`${label}'s negative prompt is empty.`);
  }
}

/** Continuity: Image 1 and Image 2 must be built from the SAME world. Both
 *  images' prompts already come from one shared continuityBible by
 *  construction (see reel-ai-visual-direction.ts's own header), so this
 *  checks that the actual PROMPT TEXT still reflects that shared world --
 *  every recurring prop and the environment's location must genuinely
 *  appear in both images' composed prompt text, not just in the underlying
 *  data object. */
function checkContinuity(aiDirection: ComposedReelAIVisualDirection, messages: string[]): void {
  const { continuityBible, image1, image2 } = aiDirection;

  for (const prop of continuityBible.recurringProps) {
    const keyPhrase = prop.split(",")[0].split(" -- ")[0].trim();
    if (!keyPhrase) continue;
    if (!hasWord(image1.prompt, keyPhrase)) {
      messages.push(`A recurring prop ("${keyPhrase}") doesn't appear in Image 1's prompt -- continuity may be broken.`);
    }
    if (!hasWord(image2.prompt, keyPhrase)) {
      messages.push(`A recurring prop ("${keyPhrase}") doesn't appear in Image 2's prompt -- continuity may be broken.`);
    }
  }

  const locationKeyPhrase = continuityBible.environment.location.split(",")[0].trim();
  if (locationKeyPhrase && !hasWord(image1.prompt, locationKeyPhrase)) {
    messages.push("Image 1's prompt doesn't mention the shared location.");
  }
  if (locationKeyPhrase && !hasWord(image2.prompt, locationKeyPhrase)) {
    messages.push("Image 2's prompt doesn't mention the shared location.");
  }

  for (const character of continuityBible.characters) {
    if (!hasWord(image1.prompt, character.role)) {
      messages.push(`Character "${character.role}" doesn't appear in Image 1's prompt.`);
    }
    if (!hasWord(image2.prompt, character.role)) {
      messages.push(`Character "${character.role}" doesn't appear in Image 2's prompt.`);
    }
  }
}

/** Transformation: Image 1 and Image 2 must actually differ -- an AI
 *  Visual Direction whose two images describe the identical moment isn't a
 *  story, it's one image described twice. */
function checkTransformation(aiDirection: ComposedReelAIVisualDirection, messages: string[]): void {
  const { image1, image2 } = aiDirection;

  if (image1.state.trim() === image2.state.trim()) {
    messages.push("Image 1 and Image 2 describe the identical story state -- there is no visible transformation.");
  }
  if (image1.composition.trim() === image2.composition.trim()) {
    messages.push("Image 1 and Image 2 use the identical composition -- the images won't show any change.");
  }
  if (image1.subjectAction.trim() === image2.subjectAction.trim()) {
    messages.push("Image 1 and Image 2 describe the identical subject action.");
  }
}

const PROMPT_QUALITY_CHECKS: readonly { label: string; check: (prompt: string) => boolean }[] = [
  { label: "a 9:16 vertical framing instruction", check: (p) => hasWord(p, "9:16") },
  { label: "a no-text/no-typography instruction", check: (p) => hasWord(p, "no typography") || hasWord(p, "without requiring text") },
  { label: "a story context section", check: (p) => hasWord(p, "STORY CONTEXT") },
  { label: "cultural authenticity guidance", check: (p) => hasWord(p, "CULTURAL AUTHENTICITY") },
  { label: "a composition description", check: (p) => hasWord(p, "COMPOSITION") },
  { label: "an emotional-state description", check: (p) => hasWord(p, "EMOTION") },
  { label: "continuity guidance", check: (p) => hasWord(p, "VISUAL CONTINUITY") },
  { label: "which frames it serves", check: (p) => hasWord(p, "Serves:") },
];

/** Prompt quality: each generated prompt must actually contain the
 *  sections this project's own convention requires, not just a vague
 *  paragraph -- checked by looking for each section's own marker text /
 *  required instruction, never by asking an AI to judge quality. */
function checkPromptQuality(image: ReelAIImageDirection, label: "Image 1" | "Image 2", messages: string[]): void {
  for (const { label: itemLabel, check } of PROMPT_QUALITY_CHECKS) {
    if (!check(image.prompt)) {
      messages.push(`${label}'s prompt is missing ${itemLabel}.`);
    }
  }
  if (isBlank(image.negativePrompt)) {
    messages.push(`${label} has no negative prompt.`);
  } else if (!hasWord(image.negativePrompt, "text") || !hasWord(image.negativePrompt, "watermark")) {
    messages.push(`${label}'s negative prompt is missing the standard text/watermark exclusions.`);
  }
}

/** Aram connection: verifies the AI Visual Direction genuinely belongs to
 *  this poem's own Aram -- deliberately NOT by requiring the prompt to
 *  echo the abstract Aram word ("generosity", "belonging") anywhere: the
 *  whole point of the locked-build architecture is that Frames 1-3 SHOW
 *  the value through an ordinary human action without ever NAMING it (that
 *  naming is Frame 5's own explicit job) -- see reel-ai-visual-direction.ts's
 *  own module header on why the earlier "TEACHING INTENT" block, which DID
 *  quote the lesson into the prompt, was removed. A keyword-echo check
 *  here would fight that design goal rather than verify it, so this checks
 *  only what's honestly checkable: the poem's Aram actually has content to
 *  derive from, and this AI direction is for the same poem it's being
 *  checked against. */
function checkAramConnection(aiDirection: ComposedReelAIVisualDirection, storyboard: ComposedReelStoryboard, messages: string[]): void {
  if (isBlank(storyboard.aram.value)) {
    messages.push("This poem's Aram is incomplete, so the AI Visual Direction can't be verified as derived from it.");
    return;
  }

  if (aiDirection.poemNumber !== storyboard.poemNumber) {
    messages.push("The AI Visual Direction is for a different poem than the storyboard it's being checked against.");
  }
}

/** Runs the full AI Visual Direction QA pass for one poem's already-
 *  composed AI direction and storyboard. Deterministic and pure -- safe
 *  to call directly in a component's render body, same as
 *  buildComposedReelAIVisualDirection itself. */
export function runReelAIVisualDirectionQA(
  aiDirection: ComposedReelAIVisualDirection | null,
  storyboard: ComposedReelStoryboard | null
): ReelAIVisualDirectionQA {
  if (!aiDirection) {
    return { passed: false, messages: ["AI Visual Direction is not available for this poem yet."] };
  }
  if (!storyboard) {
    return { passed: false, messages: ["Cannot validate AI Visual Direction without the poem's storyboard."] };
  }

  const messages: string[] = [];

  checkStructure(aiDirection, messages);
  checkContinuity(aiDirection, messages);
  checkTransformation(aiDirection, messages);
  checkPromptQuality(aiDirection.image1, "Image 1", messages);
  checkPromptQuality(aiDirection.image2, "Image 2", messages);
  checkAramConnection(aiDirection, storyboard, messages);

  return { passed: messages.length === 0, messages };
}
