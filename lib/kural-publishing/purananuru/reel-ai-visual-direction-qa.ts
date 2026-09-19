/**
 * Purananuru Reel Storyboard — AI Visual Direction QA
 * ----------------------------------------------------------------------------
 * Phase 9C. A deterministic, lightweight editorial contract for
 * reel-ai-visual-direction.ts's ComposedReelAIVisualDirection -- NOT an AI
 * evaluator, no model calls, no judgment call a human couldn't verify in one
 * read of the two prompts. Sibling to reel-visual-story-qa.ts (Phase 8A) and
 * reel-motion-direction-qa.ts (Phase 9A), same convention: a pure function
 * returning `{ passed, messages }` with jargon-free messages the UI can show
 * as-is.
 *
 * This module never reads or writes canon.ts, never calls an AI API, and is
 * read-only with respect to both ComposedReelAIVisualDirection and
 * ComposedReelStoryboard -- it only inspects already-composed data and
 * reports on it.
 */

import type { ComposedReelAIVisualDirection, ReelAIFrameDirection } from "./reel-ai-visual-direction";
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
 *  matches the same "check anyway" convention reel-visual-story-qa.ts and
 *  reel-motion-direction-qa.ts already use. */
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

  for (const [label, frame] of [
    ["Frame 2", aiDirection.frame2],
    ["Frame 5", aiDirection.frame5],
  ] as const) {
    if (isBlank(frame.state)) messages.push(`${label}'s AI direction is missing a story-state description.`);
    if (isBlank(frame.composition)) messages.push(`${label}'s AI direction is missing a composition description.`);
    if (isBlank(frame.subjectAction)) messages.push(`${label}'s AI direction is missing a subject-action description.`);
    if (isBlank(frame.emotionalTone)) messages.push(`${label}'s AI direction is missing an emotional tone.`);
    if (isBlank(frame.prompt)) messages.push(`${label}'s AI image prompt is empty.`);
    if (isBlank(frame.negativePrompt)) messages.push(`${label}'s negative prompt is empty.`);
  }
}

/** Continuity: Frame 2 and Frame 5 must be built from the SAME world.
 *  Both frames' prompts already come from one shared continuityBible by
 *  construction (see reel-ai-visual-direction.ts's own header), so this
 *  checks that the actual PROMPT TEXT still reflects that shared world --
 *  every recurring prop and the environment's location must genuinely
 *  appear in both frames' composed prompt text, not just in the
 *  underlying data object. */
function checkContinuity(aiDirection: ComposedReelAIVisualDirection, messages: string[]): void {
  const { continuityBible, frame2, frame5 } = aiDirection;

  for (const prop of continuityBible.recurringProps) {
    const description = prop.includes(":") ? prop.slice(prop.indexOf(":") + 1).trim() : prop;
    const keyPhrase = description.split(",")[0].split(" -- ")[0].trim();
    if (!keyPhrase) continue;
    if (!hasWord(frame2.prompt, keyPhrase)) {
      messages.push(`A recurring prop ("${keyPhrase}") doesn't appear in Frame 2's prompt -- continuity may be broken.`);
    }
    if (!hasWord(frame5.prompt, keyPhrase)) {
      messages.push(`A recurring prop ("${keyPhrase}") doesn't appear in Frame 5's prompt -- continuity may be broken.`);
    }
  }

  const locationKeyPhrase = continuityBible.environment.location.split(",")[0].trim();
  if (locationKeyPhrase && !hasWord(frame2.prompt, locationKeyPhrase)) {
    messages.push("Frame 2's prompt doesn't mention the shared location.");
  }
  if (locationKeyPhrase && !hasWord(frame5.prompt, locationKeyPhrase)) {
    messages.push("Frame 5's prompt doesn't mention the shared location.");
  }

  for (const character of continuityBible.characters) {
    if (!hasWord(frame2.prompt, character.role)) {
      messages.push(`Character "${character.role}" doesn't appear in Frame 2's prompt.`);
    }
    if (!hasWord(frame5.prompt, character.role)) {
      messages.push(`Character "${character.role}" doesn't appear in Frame 5's prompt.`);
    }
  }
}

/** Transformation: Frame 2 and Frame 5 must actually differ -- an AI
 *  Visual Direction whose two frames describe the identical moment isn't
 *  a story, it's one image described twice. */
function checkTransformation(aiDirection: ComposedReelAIVisualDirection, messages: string[]): void {
  const { frame2, frame5 } = aiDirection;

  if (frame2.frame !== 2) messages.push("Frame 2's direction is not tagged as frame 2.");
  if (frame5.frame !== 5) messages.push("Frame 5's direction is not tagged as frame 5.");

  if (frame2.state.trim() === frame5.state.trim()) {
    messages.push("Frame 2 and Frame 5 describe the identical story state -- there is no visible transformation.");
  }
  if (frame2.composition.trim() === frame5.composition.trim()) {
    messages.push("Frame 2 and Frame 5 use the identical composition -- the image itself won't show any change.");
  }
  if (frame2.subjectAction.trim() === frame5.subjectAction.trim()) {
    messages.push("Frame 2 and Frame 5 describe the identical subject action.");
  }
}

const PROMPT_QUALITY_CHECKS: readonly { label: string; check: (prompt: string) => boolean }[] = [
  { label: "a 9:16 vertical framing instruction", check: (p) => hasWord(p, "9:16") },
  { label: "a no-text/no-typography instruction", check: (p) => hasWord(p, "no typography") || hasWord(p, "without requiring text") },
  { label: "cultural authenticity guidance", check: (p) => hasWord(p, "CULTURAL AUTHENTICITY") },
  { label: "a composition description", check: (p) => hasWord(p, "COMPOSITION") },
  { label: "an emotional-state description", check: (p) => hasWord(p, "EMOTION") },
  { label: "continuity guidance", check: (p) => hasWord(p, "VISUAL CONTINUITY") },
];

/** Prompt quality: each generated prompt must actually contain the
 *  sections Phase 9C's own brief requires (section 6), not just a vague
 *  paragraph -- checked by looking for each section's own marker text /
 *  required instruction, never by asking an AI to judge quality. */
function checkPromptQuality(frame: ReelAIFrameDirection, label: "Frame 2" | "Frame 5", messages: string[]): void {
  for (const { label: itemLabel, check } of PROMPT_QUALITY_CHECKS) {
    if (!check(frame.prompt)) {
      messages.push(`${label}'s prompt is missing ${itemLabel}.`);
    }
  }
  if (isBlank(frame.negativePrompt)) {
    messages.push(`${label} has no negative prompt.`);
  } else if (!hasWord(frame.negativePrompt, "text") || !hasWord(frame.negativePrompt, "watermark")) {
    messages.push(`${label}'s negative prompt is missing the standard text/watermark exclusions.`);
  }
}

/** Semantic: the AI Visual Direction must stay traceable to Phase 9A's
 *  own ReelMotionDirection -- both the motion's actor and its target must
 *  be referenced somewhere in this poem's continuity bible, either as a
 *  character id (for a person/group) or as a semantically-tagged
 *  recurring prop (for an object -- see reel-ai-visual-direction.ts's own
 *  "SEMANTIC ANCHORING" doc comment for the "<id>: description" tag
 *  convention this looks for). This is what keeps the AI Visual
 *  Direction from silently telling a different story than Phase 9A's
 *  motionType/relationship already established. */
function checkSemanticConsistency(aiDirection: ComposedReelAIVisualDirection, storyboard: ComposedReelStoryboard, messages: string[]): void {
  const { characters, recurringProps } = aiDirection.continuityBible;
  const characterIds = new Set(characters.map((c) => c.id));
  const taggedPropIds = new Set(
    recurringProps
      .map((p) => (p.includes(":") ? p.slice(0, p.indexOf(":")).trim() : null))
      .filter((tag): tag is string => tag !== null)
  );

  const { actor, target } = storyboard.motionDirection.relationship;
  for (const value of [actor, target]) {
    if (!characterIds.has(value) && !taggedPropIds.has(value)) {
      messages.push(
        `The AI Visual Direction doesn't reference this poem's motion "${value}" as either a character or a tagged recurring prop -- it may be telling a different story than the Motion Direction.`
      );
    }
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
  checkPromptQuality(aiDirection.frame2, "Frame 2", messages);
  checkPromptQuality(aiDirection.frame5, "Frame 5", messages);
  checkSemanticConsistency(aiDirection, storyboard, messages);

  return { passed: messages.length === 0, messages };
}
