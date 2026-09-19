/**
 * Purananuru Reel Storyboard — Visual Story QA
 * ----------------------------------------------------------------------------
 * Phase 8A. A deterministic, lightweight editorial contract for the Frame 2
 * / Frame 5 visual-story pair (reel-storyboard-content.ts's ReelVisualScene)
 * -- NOT an AI evaluator, not a general rules engine. Every check below is a
 * plain structural/string comparison; nothing here calls a model or makes a
 * judgment call a human couldn't verify in one glance at the two scenes.
 *
 * Sibling to aathichoodi/quality-check.ts and purananuru/quality-check.ts,
 * but intentionally its own file rather than folded into either: those two
 * validate SOURCE PROVENANCE on an already-composed ComposedPoem/
 * ComposedEpisode (is the Tamil verified? is there a source URL?) -- a
 * completely different question from "does this poem's visual-story PAIR
 * actually describe one coherent transformation?", which only exists once
 * the Reel Storyboard's own frame2Scene/frame5Scene are composed. Mixing the
 * two into one file would blur what is a provenance concern and what is a
 * visual-editorial concern.
 *
 * This module never reads or writes canon.ts, never duplicates poem text,
 * and is read-only with respect to ReelVisualScene -- it only inspects the
 * already-authored data in reel-storyboard-content.ts and reports on it.
 */

import type { ComposedReelStoryboard, ReelVisualScene, ReelStoryRole, ReelVisualSceneType } from "./reel-storyboard-content";

export interface ReelStoryArcSummary {
  frame2Role: ReelStoryRole;
  frame5Role: ReelStoryRole;
  /** The poem's Frame 2 -> Frame 5 arc, e.g. "Stranger → Belonging" --
   *  read from frame2Scene.emotionalMovement (the two scenes are expected
   *  to agree; runReelVisualStoryQA flags it if they don't). */
  emotionalMovement: string;
  visualRelationship: ReelVisualScene["visualRelationship"];
}

export interface ReelVisualStoryQA {
  passed: boolean;
  /** Human-readable, jargon-free messages -- one per problem found. Empty
   *  when passed. The UI decides how to prefix these (✓/⚠); this module
   *  stays presentation-free, same convention as QualityCheckResult in
   *  quality-check.ts. */
  messages: string[];
  /** null only when the storyboard itself has no visual-scene pair to
   *  summarize (should not happen for a poem with Reel content authored,
   *  but callers pass a possibly-null ComposedReelStoryboard). */
  storyArc: ReelStoryArcSummary | null;
}

/** A caption is one short supporting phrase, not a sentence -- mirrors the
 *  Phase 7 brief's own "one short supporting phrase at most" rule for
 *  Frame 2 / Frame 5. Counted in Tamil characters, not words, since Tamil
 *  doesn't wrap the way English does. */
const MAX_CAPTION_LENGTH = 40;

/** Scene-type "families": which story roles make sense for a scene that
 *  ESTABLISHES the situation (Frame 2) versus one that RESOLVES it
 *  (Frame 5). Lightweight, deterministic, and safe -- it only checks that
 *  the authored storyRole agrees with which half of the pair the scene's
 *  own sceneType belongs to, never a judgment about the scene's quality. */
const SITUATION_SCENE_TYPES: ReadonlySet<ReelVisualSceneType> = new Set(["rare-gift", "abundance", "stranger"]);
const RESOLUTION_SCENE_TYPES: ReadonlySet<ReelVisualSceneType> = new Set(["choice", "sharing", "belonging"]);
const SITUATION_ROLES: ReadonlySet<ReelStoryRole> = new Set(["contrast", "tension"]);
const RESOLUTION_ROLES: ReadonlySet<ReelStoryRole> = new Set(["transformation", "resolution"]);

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** A lightweight "does this actually read as a movement" check -- requires
 *  an arrow separating two non-empty sides, e.g. "Stranger → Belonging".
 *  Accepts "->" too, in case a future entry is typed without the unicode
 *  arrow. Not a grammar checker -- just rules out a single static label
 *  standing in for a transformation. */
function looksLikeAMovement(value: string): boolean {
  const parts = value.split(/→|->/);
  return parts.length === 2 && parts.every((p) => !isBlank(p));
}

function checkScene(frameLabel: "Frame 2" | "Frame 5", scene: ReelVisualScene, messages: string[]): void {
  if (isBlank(scene.title)) messages.push(`${frameLabel}'s visual scene has an empty title.`);
  if (isBlank(scene.description)) messages.push(`${frameLabel}'s visual scene has an empty description.`);
  if (isBlank(scene.visualMotif)) messages.push(`${frameLabel}'s visual scene has an empty motif.`);
  if (isBlank(scene.composition)) messages.push(`${frameLabel}'s visual scene has an empty composition note.`);
  if (isBlank(scene.captionLine)) messages.push(`${frameLabel} is missing its caption line.`);
  else if (scene.captionLine.trim().length > MAX_CAPTION_LENGTH) {
    messages.push(`${frameLabel}'s caption line is too long for a one-line supporting phrase.`);
  }

  if (isBlank(scene.emotionalMovement)) {
    messages.push(`${frameLabel} is missing emotional movement metadata.`);
  } else if (!looksLikeAMovement(scene.emotionalMovement)) {
    messages.push(`${frameLabel}'s emotional movement doesn't read as a transformation (expected "A → B").`);
  }

  if (!scene.visualRelationship) {
    messages.push(`${frameLabel} is missing visual relationship metadata.`);
  }

  const isSituationType = SITUATION_SCENE_TYPES.has(scene.sceneType);
  const isResolutionType = RESOLUTION_SCENE_TYPES.has(scene.sceneType);
  if (isSituationType && !SITUATION_ROLES.has(scene.storyRole)) {
    messages.push(`${frameLabel}'s story role doesn't match its scene type (expected a contrast/tension role).`);
  } else if (isResolutionType && !RESOLUTION_ROLES.has(scene.storyRole)) {
    messages.push(`${frameLabel}'s story role doesn't match its scene type (expected a transformation/resolution role).`);
  }
}

/** Flags a visual scene's own editorial fields for accidentally repeating
 *  the poem's literal Tamil or its Frame 4 meaning line -- the visual
 *  layer should stay descriptive of the COMPOSITION, never a second copy
 *  of the literary text (Part 7's "keep canon separation clean"). A plain
 *  substring check against the storyboard's own already-derived text, not
 *  a second read of canon.ts. */
function checkNoDuplicatedLiteraryText(
  frameLabel: "Frame 2" | "Frame 5",
  scene: ReelVisualScene,
  storyboard: ComposedReelStoryboard,
  messages: string[]
): void {
  const literaryStrings = [...storyboard.excerptTamilLines, storyboard.meaningLine].filter((s) => s.trim().length > 0);
  const editorialStrings = [scene.title, scene.description, scene.captionLine];
  for (const literary of literaryStrings) {
    for (const editorial of editorialStrings) {
      if (editorial.trim().length > 0 && editorial.includes(literary)) {
        messages.push(`${frameLabel}'s visual scene repeats the poem's own text -- it should describe the visual, not the poem.`);
        return;
      }
    }
  }
}

/** Runs the full Visual Story QA pass for one poem's already-composed Reel
 *  Storyboard. Deterministic and pure -- safe to call directly in a
 *  component's render body, same as buildComposedReelStoryboard itself. */
export function runReelVisualStoryQA(storyboard: ComposedReelStoryboard | null): ReelVisualStoryQA {
  if (!storyboard) {
    return { passed: false, messages: ["Visual story data is not available for this poem yet."], storyArc: null };
  }

  const { frame2Scene, frame5Scene } = storyboard;
  const messages: string[] = [];

  checkScene("Frame 2", frame2Scene, messages);
  checkScene("Frame 5", frame5Scene, messages);
  checkNoDuplicatedLiteraryText("Frame 2", frame2Scene, storyboard, messages);
  checkNoDuplicatedLiteraryText("Frame 5", frame5Scene, storyboard, messages);

  if (frame2Scene.sceneType === frame5Scene.sceneType) {
    messages.push("Frame 2 and Frame 5 use the same scene type -- the story doesn't visually change.");
  }

  if (!isBlank(frame2Scene.emotionalMovement) && !isBlank(frame5Scene.emotionalMovement)) {
    if (frame2Scene.emotionalMovement.trim() !== frame5Scene.emotionalMovement.trim()) {
      messages.push("Frame 2 and Frame 5 describe different story movements -- their emotional movement should match.");
    }
  }

  if (frame2Scene.visualRelationship && frame5Scene.visualRelationship) {
    if (frame2Scene.visualRelationship !== frame5Scene.visualRelationship) {
      messages.push("Frame 2 and Frame 5 use different visual relationships -- Frame 5 should resolve the same axis Frame 2 opened.");
    }
  }

  const storyArc: ReelStoryArcSummary = {
    frame2Role: frame2Scene.storyRole,
    frame5Role: frame5Scene.storyRole,
    emotionalMovement: frame2Scene.emotionalMovement || frame5Scene.emotionalMovement,
    visualRelationship: frame2Scene.visualRelationship ?? frame5Scene.visualRelationship,
  };

  return { passed: messages.length === 0, messages, storyArc };
}
