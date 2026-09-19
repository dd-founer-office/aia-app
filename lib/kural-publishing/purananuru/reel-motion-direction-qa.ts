/**
 * Purananuru Reel Storyboard — Motion Direction QA
 * ----------------------------------------------------------------------------
 * Phase 9A. A deterministic, lightweight editorial contract for
 * reel-storyboard-content.ts's ReelMotionDirection -- NOT an AI evaluator,
 * no model calls, no judgment call a human couldn't verify in one glance.
 * Sibling to reel-visual-story-qa.ts (Phase 8A), same convention: a pure
 * function over an already-composed ComposedReelStoryboard, returning
 * `{ passed, messages }` with jargon-free messages the UI can show as-is.
 *
 * This module never reads or writes canon.ts, never touches the static
 * renderer, and is read-only with respect to ReelMotionDirection -- it only
 * inspects the already-authored data in reel-storyboard-content.ts. Phase 9A
 * is motion DIRECTION only: nothing here animates anything.
 */

import type {
  ComposedReelStoryboard,
  ReelMotionDirection,
  ReelMotionTarget,
  ReelMotionType,
  ReelMotionPacing,
  ReelMotionPhase,
  ReelMotionEasing,
  ReelReducedMotionMode,
  ReelVisualRelationship,
} from "./reel-storyboard-content";

export interface ReelMotionDirectionQA {
  passed: boolean;
  /** Human-readable, jargon-free messages -- one per problem found. Empty
   *  when passed. Presentation-free, same convention as
   *  ReelVisualStoryQA['messages'] in reel-visual-story-qa.ts. */
  messages: string[];
}

type ReelMotionRelationshipAction = ReelMotionDirection["relationship"]["action"];

const VALID_MOTION_TYPES: ReadonlySet<ReelMotionType> = new Set(["transfer", "equalize", "connect"]);
const VALID_TARGETS: ReadonlySet<ReelMotionTarget> = new Set([
  "primaryFigure",
  "secondaryFigure",
  "giftObject",
  "leftColumn",
  "rightColumn",
  "isolatedFigure",
  "communityGroup",
  "connectionArc",
]);
const VALID_ACTIONS: ReadonlySet<ReelMotionRelationshipAction> = new Set([
  "moveToward",
  "crossGap",
  "levelWith",
  "closeGap",
]);
const VALID_PACING: ReadonlySet<ReelMotionPacing> = new Set(["instant", "brief", "moderate", "slow"]);
const VALID_PHASES: ReadonlySet<ReelMotionPhase> = new Set(["hold", "transition", "settle"]);
const VALID_EASING: ReadonlySet<ReelMotionEasing> = new Set(["linear", "easeIn", "easeOut", "easeInOut"]);
const VALID_REDUCED_MOTION_MODES: ReadonlySet<ReelReducedMotionMode> = new Set([
  "none",
  "fade",
  "final-state",
  "instant",
]);

/** Which motionType and which target FAMILY a poem's visualRelationship
 *  (from its Story Arc, Phase 8A) implies -- the "semantic coherence"
 *  check the Phase 9A brief asks for: a "stranger -> belonging" poem
 *  (individual-community) should never produce motionType "equalize", an
 *  "abundance -> sharing" poem (column-column) should never produce a
 *  figure-only motion, etc. `null` means no poem currently uses that
 *  relationship (ReelVisualRelationship's own "figure-figure" is kept
 *  unused for a future poem -- see that type's doc comment), so there is
 *  nothing yet to check it against. */
const EXPECTED_MOTION_TYPE_BY_VISUAL_RELATIONSHIP: Record<ReelVisualRelationship, ReelMotionType | null> = {
  "object-person": "transfer",
  "column-column": "equalize",
  "individual-community": "connect",
  "figure-figure": null,
};

const TARGET_FAMILY_BY_VISUAL_RELATIONSHIP: Record<ReelVisualRelationship, ReadonlySet<ReelMotionTarget> | null> = {
  "object-person": new Set(["primaryFigure", "secondaryFigure", "giftObject"]),
  "column-column": new Set(["leftColumn", "rightColumn"]),
  "individual-community": new Set(["isolatedFigure", "communityGroup", "connectionArc"]),
  "figure-figure": null,
};

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function formatList(values: readonly string[]): string {
  return values.join(", ");
}

/** Structural checks: is every field present and a member of its own
 *  controlled vocabulary. Defensive even though TypeScript already
 *  constrains these types at compile time -- matches
 *  reel-visual-story-qa.ts's own convention of checking anyway, so a
 *  future poem authored with a typo'd literal (which TS would also catch,
 *  but this keeps the two QA files symmetric and the checks self-
 *  documenting) is reported the same human-readable way. */
function checkStructure(motion: ReelMotionDirection, messages: string[]): void {
  if (!VALID_MOTION_TYPES.has(motion.motionType)) {
    messages.push(`Motion type "${motion.motionType}" is not a recognized motion (expected one of: ${formatList([...VALID_MOTION_TYPES])}).`);
  }

  if (!VALID_TARGETS.has(motion.relationship.actor)) {
    messages.push(`Motion actor "${motion.relationship.actor}" is not a recognized motion target.`);
  }
  if (!VALID_TARGETS.has(motion.relationship.target)) {
    messages.push(`Motion target "${motion.relationship.target}" is not a recognized motion target.`);
  }
  if (!VALID_ACTIONS.has(motion.relationship.action)) {
    messages.push(`Motion action "${motion.relationship.action}" is not a recognized action.`);
  }
  if (isBlank(motion.relationship.consequence)) {
    messages.push("Motion direction is missing a consequence -- what results from this motion?");
  }

  if (isBlank(motion.sequenceLabel)) {
    messages.push("Motion direction is missing its sequence label.");
  }

  if (!VALID_PACING.has(motion.timing.durationIntent)) {
    messages.push(`Motion timing has an unrecognized duration intent "${motion.timing.durationIntent}".`);
  }
  if (motion.timing.sequence.length === 0) {
    messages.push("Motion timing is missing its phase sequence.");
  } else {
    for (const phase of motion.timing.sequence) {
      if (!VALID_PHASES.has(phase)) {
        messages.push(`Motion timing sequence includes an unrecognized phase "${phase}".`);
        break;
      }
    }
  }

  if (!VALID_EASING.has(motion.easing)) {
    messages.push(`Motion has an unrecognized easing "${motion.easing}".`);
  }

  if (!VALID_REDUCED_MOTION_MODES.has(motion.reducedMotion.mode)) {
    messages.push(`Reduced-motion mode "${motion.reducedMotion.mode}" is not recognized.`);
  }
  if (isBlank(motion.reducedMotion.description)) {
    messages.push("Motion direction is missing a reduced-motion description.");
  }
}

/** Story coherence: does the motion actually represent a Frame 2 -> Frame
 *  5 transition, rather than a no-op or a motion aimed at itself. */
function checkCoherence(motion: ReelMotionDirection, messages: string[]): void {
  if (motion.relationship.actor === motion.relationship.target) {
    messages.push("Motion direction is a no-op -- its actor and target are the same, so nothing changes between Frame 2 and Frame 5.");
  }
}

/** Semantic coherence against the poem's own Story Arc (Phase 8A): the
 *  motion's type and its actor/target family must agree with the poem's
 *  visualRelationship -- a "stranger -> belonging" pair must not produce
 *  an "equalize" motion, an "abundance -> sharing" pair must not produce
 *  a figure-only motion, etc. */
function checkAgainstStoryArc(motion: ReelMotionDirection, storyboard: ComposedReelStoryboard, messages: string[]): void {
  const visualRelationship = storyboard.frame2Scene.visualRelationship;

  const expectedMotionType = EXPECTED_MOTION_TYPE_BY_VISUAL_RELATIONSHIP[visualRelationship];
  if (expectedMotionType && motion.motionType !== expectedMotionType) {
    messages.push(
      `Motion type "${motion.motionType}" doesn't match this poem's story arc (a "${visualRelationship}" story expects "${expectedMotionType}").`
    );
  }

  const targetFamily = TARGET_FAMILY_BY_VISUAL_RELATIONSHIP[visualRelationship];
  if (targetFamily) {
    if (!targetFamily.has(motion.relationship.actor)) {
      messages.push(`Motion actor "${motion.relationship.actor}" doesn't fit this poem's story arc (expected one of: ${formatList([...targetFamily])}).`);
    }
    if (!targetFamily.has(motion.relationship.target)) {
      messages.push(`Motion target "${motion.relationship.target}" doesn't fit this poem's story arc (expected one of: ${formatList([...targetFamily])}).`);
    }
  }
}

/** Runs the full Motion Direction QA pass for one poem's already-composed
 *  Reel Storyboard. Deterministic and pure -- safe to call directly in a
 *  component's render body, same as runReelVisualStoryQA. */
export function runReelMotionDirectionQA(storyboard: ComposedReelStoryboard | null): ReelMotionDirectionQA {
  if (!storyboard) {
    return { passed: false, messages: ["Motion direction is not available for this poem yet."] };
  }

  const messages: string[] = [];
  const { motionDirection } = storyboard;

  checkStructure(motionDirection, messages);
  checkCoherence(motionDirection, messages);
  checkAgainstStoryArc(motionDirection, storyboard, messages);

  return { passed: messages.length === 0, messages };
}
