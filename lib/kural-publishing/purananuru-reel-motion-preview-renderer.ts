/**
 * Distant Devotion — Asset Generator: Purananuru Reel Motion Preview Renderer
 * ----------------------------------------------------------------------------
 * Phase 9B. Makes the semantic Motion Direction data (Phase 9A,
 * purananuru/reel-storyboard-content.ts's ReelMotionDirection) visually
 * previewable -- an internal, in-browser animated preview, NOT video export.
 * No MediaRecorder, no ffmpeg, no MP4/WebM, no animation library.
 *
 *   Poem Canon -> Visual Story -> Story Arc -> Motion Direction -> HERE
 *
 * This file does NOT rewrite purananuru-reel-storyboard-renderer.ts, which
 * stays the protected static baseline (still producing byte-identical
 * 1080x1920 PNGs). Instead it REUSES that file's own exported drawing
 * primitives (drawFigure, drawObjectAccent, drawConnectorArc, drawColumn,
 * roundedRectPath), its chrome (drawFrameChrome), its exact scene dispatcher
 * (drawVisualScene) and scene layout (drawSceneFrame /
 * computeSceneFrameLayout), and its color constants -- none of which changed
 * behavior when they were exported, only visibility.
 *
 * CRITICAL INVARIANT (enforced by construction, not approximation): at
 * progress=0 this renderer calls the exact same drawFrameChrome +
 * drawSceneFrame calls, with the exact same arguments, that
 * purananuru-reel-storyboard-renderer.ts's own drawHumanMomentFrame (Frame
 * 2) makes; at progress=1 it makes the same calls drawTodayFrame (Frame 5)
 * makes. There is no separate "final state" implementation to drift out of
 * sync -- the real static-frame code IS the endpoint.
 *
 * Only the INTERIOR of the transition (0 < progress < 1) has new drawing
 * code, and that code is keyed by MOTION TYPE ("transfer" | "equalize" |
 * "connect" -- Phase 9A's own controlled vocabulary), never by poem number:
 * a future poem reusing "equalize" automatically reuses
 * drawEqualizeInterior below, no poem-specific branch anywhere in this file.
 */

import {
  FOREGROUND,
  PRIMARY,
  BORDER,
  drawFrameChrome,
  drawSceneFrame,
  computeSceneFrameLayout,
  drawFigure,
  drawObjectAccent,
  drawConnectorArc,
  roundedRectPath,
  wrapText,
  drawCappedLines,
  type SceneStage,
} from "./purananuru-reel-storyboard-renderer";
import type {
  ComposedReelStoryboard,
  ReelMotionType,
  ReelMotionPhase,
  ReelMotionPacing,
  ReelMotionEasing,
  ReelReducedMotionMode,
} from "./purananuru/reel-storyboard-content";

/** Phase 9B's own small animation-progress model (Part 3) -- the renderer
 *  needs to know the current normalized position (0..1) and which semantic
 *  phase that position falls in. Nothing here is a general-purpose
 *  animation framework: `phase` is entirely derived from `progress` (see
 *  getMotionPhase below), carried alongside it only because Phase 9A's own
 *  vocabulary names it as a first-class concept a QA check or future UI
 *  might want to read directly, without recomputing it. */
export interface ReelMotionState {
  progress: number;
  phase: ReelMotionPhase;
}

/** Part 8: semantic pacing becomes actual milliseconds HERE, and only
 *  here -- nowhere else in this file (or the hook that drives it) hardcodes
 *  a duration. Deliberately unhurried ("the motion should feel deliberate
 *  rather than frantic, do not optimize for maximum animation speed"):
 *  even "brief" is more than half a second. "instant" is 0 -- the driver
 *  is expected to skip the animated loop entirely for it (see
 *  useReelMotionPreview.ts), not run a zero-length rAF loop. */
export const MOTION_PACING_MS: Record<ReelMotionPacing, number> = {
  instant: 0,
  brief: 600,
  moderate: 1000,
  slow: 1600,
};

/** Part 8's HOLD -> TRANSITION -> SETTLE structure, as fixed fractions of
 *  the total duration -- a brief pause on the starting composition, the
 *  actual motion, a brief pause on the arrived composition. Small, fixed,
 *  centralized; never exposed as arbitrary per-call timing values. */
const HOLD_FRACTION = 0.15;
const TRANSITION_FRACTION = 0.7;
const TRANSITION_END_FRACTION = HOLD_FRACTION + TRANSITION_FRACTION; // 0.85

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Maps normalized overall progress to its semantic phase (Part 8). Pure,
 *  used both by the renderer's own internal math and by the preview hook
 *  to populate ReelMotionState.phase. */
export function getMotionPhase(progress: number): ReelMotionPhase {
  const p = clamp01(progress);
  if (p < HOLD_FRACTION) return "hold";
  if (p < TRANSITION_END_FRACTION) return "transition";
  return "settle";
}

/** Part 9: the one centralized easing function for all four named
 *  intents -- no spring physics, no bounce, no elastic, no per-poem
 *  curves. Standard quadratic easing, restrained and editorial. Both
 *  endpoints are exact (applyEasing(0, *) === 0, applyEasing(1, *) === 1)
 *  for every case, which is what keeps the Frame 2 / Frame 5 invariant
 *  (Part 13) exact regardless of which easing a poem's motion uses. */
export function applyEasing(progress: number, easing: ReelMotionEasing): number {
  const p = clamp01(progress);
  switch (easing) {
    case "linear":
      return p;
    case "easeIn":
      return p * p;
    case "easeOut":
      return 1 - (1 - p) * (1 - p);
    case "easeInOut":
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }
}

/** Bridges Part 8 (timing/phase) and Part 9 (easing) into the single 0..1
 *  value the per-motion-type composers below actually consume: exactly 0
 *  throughout "hold", eased 0->1 across "transition", exactly 1 throughout
 *  "settle". This is what gives Part 13's invariant its exactness: at
 *  progress=0 this returns exactly 0 (not merely "close to 0"), and at
 *  progress=1 it returns exactly 1, for every easing function above. */
export function computeVisualProgress(progress: number, easing: ReelMotionEasing): number {
  const p = clamp01(progress);
  if (p <= HOLD_FRACTION) return 0;
  if (p >= TRANSITION_END_FRACTION) return 1;
  const local = (p - HOLD_FRACTION) / TRANSITION_FRACTION;
  return applyEasing(local, easing);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** The one color-interpolation helper this file needs: a figure or column
 *  changing from "doesn't have it" (BORDER) to "has it" (PRIMARY) reads as
 *  a continuous color shift, not a hard cut, during the transition phase --
 *  restrained and editorial, not a lighting effect. */
function lerpColor(colorA: string, colorB: string, t: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Part 5 -- motionType "transfer" (Purananuru 91, rare-gift -> choice).
 *  Mirrors drawVisualScene's own "rare-gift"/"choice" case constants
 *  exactly (same figureScale/baselineY/ax/bx/objY formulas) so the
 *  interior motion reads as continuous with the exact static endpoints on
 *  either side of it -- if those static cases' proportions ever change,
 *  keep these in sync. Figure A dims toward BORDER, Figure B gains
 *  PRIMARY, the gift object crosses horizontally between them, and the
 *  Frame 5 connector arc fades in as the object approaches -- exactly the
 *  ASCII sequence the Phase 9B brief describes for this motion type. */
function drawTransferInterior(ctx: CanvasRenderingContext2D, stage: SceneStage, t: number): void {
  const { x0, x1, top, bottom } = stage;
  const stageW = x1 - x0;
  const stageH = Math.max(0, bottom - top);
  const baselineY = top + stageH * 0.86;
  const figureScale = Math.min(stageW * 0.22, stageH * 0.5);
  const ax = x0 + stageW * 0.28;
  const bx = x0 + stageW * 0.72;
  const figTop = baselineY - figureScale * 2.1;
  const objY = figTop - figureScale * 0.28;

  drawFigure(ctx, ax, figTop, figureScale, lerpColor(PRIMARY, BORDER, t), true);
  drawFigure(ctx, bx, figTop, figureScale, lerpColor(BORDER, PRIMARY, t), true);

  ctx.save();
  ctx.globalAlpha = t;
  drawConnectorArc(ctx, ax + figureScale * 0.3, objY, bx - figureScale * 0.3, objY, BORDER);
  ctx.restore();

  const objStartX = ax + figureScale * 0.05;
  const objEndX = x0 + stageW * 0.58;
  drawObjectAccent(ctx, lerp(objStartX, objEndX, t), objY, figureScale * 0.16, PRIMARY);
}

/** Part 6 -- motionType "equalize" (Purananuru 189, abundance -> sharing).
 *  Mirrors drawVisualScene's own "abundance"/"sharing" case constants.
 *  Rather than animating the discrete unit COUNT (6 units -> 4 units on
 *  the left, 2 -> 4 on the right -- the static drawColumn primitive draws
 *  whole units only), the interior frames draw each column as a single
 *  continuous bar whose height interpolates between the two endpoints'
 *  total stack heights; the discrete stacked-unit look is only needed (and
 *  only drawn, via drawColumn itself) at the exact Frame 2 / Frame 5
 *  endpoints, which this file reaches through the exact drawVisualScene
 *  call, not through this function. The connector arc + object accent
 *  participate in the transition as the Phase 9B brief asks: they fade in
 *  and track the animating column heights rather than appearing only at
 *  the end. */
function drawEqualizeInterior(ctx: CanvasRenderingContext2D, stage: SceneStage, t: number): void {
  const { x0, x1, top, bottom } = stage;
  const stageW = x1 - x0;
  const stageH = Math.max(0, bottom - top);
  const baselineY = top + stageH * 0.86;
  const colW = stageW * 0.15;
  const unitH = stageH * 0.075;
  const gap = unitH * 0.4;
  const unitTotal = unitH + gap;

  const leftX = x0 + stageW * 0.28 - colW / 2;
  const rightX = x0 + stageW * 0.72 - colW / 2;

  const leftHeightT = lerp(6 * unitTotal, 4 * unitTotal, t);
  const rightHeightT = lerp(2 * unitTotal, 4 * unitTotal, t);

  roundedRectPath(ctx, leftX, baselineY - leftHeightT, colW, leftHeightT, unitH * 0.32);
  ctx.fillStyle = PRIMARY;
  ctx.fill();

  roundedRectPath(ctx, rightX, baselineY - rightHeightT, colW, rightHeightT, unitH * 0.32);
  ctx.fillStyle = lerpColor(BORDER, PRIMARY, t);
  ctx.fill();

  const arcY = baselineY - leftHeightT - stageH * 0.06;
  ctx.save();
  ctx.globalAlpha = t;
  drawConnectorArc(ctx, leftX + colW, arcY, rightX, arcY, BORDER);
  drawObjectAccent(ctx, (leftX + colW + rightX) / 2, arcY - stageH * 0.05, unitH * 0.45, PRIMARY);
  ctx.restore();
}

/** Part 7 -- motionType "connect" (Purananuru 192, stranger -> belonging).
 *  Mirrors drawVisualScene's own "stranger"/"belonging" case constants.
 *  The three community-group figures never move (their x/y/scale/color
 *  are IDENTICAL between the static Frame 2 and Frame 5 compositions --
 *  confirmed against drawVisualScene's own "stranger"/"belonging" cases),
 *  so they are drawn at a fixed position for the whole transition; only
 *  the isolated figure animates, from its Frame-2 position/scale/color to
 *  its Frame-5 position/scale/color. Drawn first, matching the draw order
 *  drawVisualScene's own "belonging" case uses (the joining figure is the
 *  first element of that case's x-position list). No connector arc: the
 *  static stranger/belonging compositions never use one, so this
 *  interpolation doesn't invent one either. */
function drawConnectInterior(ctx: CanvasRenderingContext2D, stage: SceneStage, t: number): void {
  const { x0, x1, top, bottom } = stage;
  const stageW = x1 - x0;
  const stageH = Math.max(0, bottom - top);
  const baselineY = top + stageH * 0.86;
  const figureScale = Math.min(stageW * 0.22, stageH * 0.5);
  const figTop = baselineY - figureScale * 2.0;

  const startX = x0 + stageW * 0.18;
  const endX = x0 + stageW * 0.42;
  const startY = figTop;
  const endY = figTop + figureScale * 0.1;
  const startScale = figureScale * 0.95;
  const endScale = figureScale * 0.85;

  drawFigure(ctx, lerp(startX, endX, t), lerp(startY, endY, t), lerp(startScale, endScale, t), lerpColor(BORDER, PRIMARY, t), true);

  for (const f of [0.58, 0.72, 0.86]) {
    drawFigure(ctx, x0 + stageW * f, figTop + figureScale * 0.1, figureScale * 0.85, PRIMARY, true);
  }
}

function drawInterpolatedScene(ctx: CanvasRenderingContext2D, stage: SceneStage, motionType: ReelMotionType, t: number): void {
  switch (motionType) {
    case "transfer":
      drawTransferInterior(ctx, stage, t);
      break;
    case "equalize":
      drawEqualizeInterior(ctx, stage, t);
      break;
    case "connect":
      drawConnectInterior(ctx, stage, t);
      break;
  }
}

export interface RenderReelMotionPreviewOptions {
  width: number;
  height: number;
  storyboard: ComposedReelStoryboard;
  tamilFont: string;
  sansFont: string;
  motionState: ReelMotionState;
  /** Part 10. When set to "fade", the interior of the transition
   *  cross-dissolves the two exact static compositions (via
   *  ctx.globalAlpha around the real drawVisualScene calls) instead of
   *  positionally interpolating -- the one reduced-motion mode this
   *  dataset doesn't use but the architecture supports "naturally", per
   *  the brief's own conditional allowance. "final-state" and "instant"
   *  need no renderer-side branch at all: the caller (the preview hook)
   *  simply never advances progress past 1 for those modes, so the normal
   *  progress=1 path (== the real static Frame 5 draw) already IS the
   *  correct reduced-motion behavior. */
  reducedMotionMode?: ReelReducedMotionMode;
}

/** Renders one frame of the Frame 2 -> Frame 5 motion preview at
 *  `motionState.progress`. Part 13's invariant: at progress=0 this draws
 *  EXACTLY what the static renderer's Frame 2 (Human Moment) draws; at
 *  progress=1, EXACTLY what it draws for Frame 5 (Today) -- both via the
 *  same exported drawFrameChrome/drawSceneFrame calls the static file
 *  itself uses, never a re-implementation. Only 0 < progress < 1 reaches
 *  new (Phase 9B) drawing code. */
export function renderReelMotionPreviewFrame(ctx: CanvasRenderingContext2D, opts: RenderReelMotionPreviewOptions): void {
  const { width, height, storyboard, tamilFont, sansFont, motionState, reducedMotionMode } = opts;
  const easing = storyboard.motionDirection.easing;
  const visualT = computeVisualProgress(motionState.progress, easing);
  // Frame 2's own real frameIndex is 1 ("Human Moment"), Frame 5's is 4
  // ("Today") -- see PURANANURU_REEL_FRAME_LABELS. A single discrete swap
  // at the transition's visual midpoint (rather than a continuous
  // crossfade of the chrome text) keeps the chrome pixel-exact at both
  // ends without duplicating drawFrameChrome's own label-positioning math.
  const frameIndex = visualT < 0.5 ? 1 : 4;
  const geo = drawFrameChrome(ctx, width, height, frameIndex, sansFont, false);
  const layoutOpts = { width, height, tamilFont };

  // Part 10's "fade" reduced-motion mode -- not used by any of the current
  // three poems (all three author "final-state"), but the architecture
  // supports it naturally: a plain alpha cross-dissolve of the two exact
  // static compositions, reusing drawSceneFrame directly rather than a
  // second rendering path.
  if (reducedMotionMode === "fade" && visualT > 0 && visualT < 1) {
    ctx.save();
    ctx.globalAlpha = 1 - visualT;
    drawSceneFrame(ctx, layoutOpts, geo, storyboard.frame2Scene);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = visualT;
    drawSceneFrame(ctx, layoutOpts, geo, storyboard.frame5Scene);
    ctx.restore();
    return;
  }

  if (visualT <= 0) {
    drawSceneFrame(ctx, layoutOpts, geo, storyboard.frame2Scene);
    return;
  }
  if (visualT >= 1) {
    drawSceneFrame(ctx, layoutOpts, geo, storyboard.frame5Scene);
    return;
  }

  // Stable, non-jumping layout for the WHOLE interior transition: computed
  // once from Frame 2's own caption metrics (every caption in this
  // dataset is a single short line, so Frame 2's and Frame 5's captions
  // occupy identical layout height -- see this file's own header) rather
  // than recomputed per motion-type, avoiding any layout shift mid-motion.
  const layout = computeSceneFrameLayout(ctx, layoutOpts, geo, storyboard.frame2Scene);
  drawInterpolatedScene(ctx, layout.stage, storyboard.motionDirection.motionType, visualT);

  // Caption: switches once, at the same visual midpoint the chrome page
  // label swaps at, rather than crossfading continuously across the whole
  // transition. An earlier version crossfaded both captions' opacity the
  // entire time, but for real caption pairs (e.g. poem 192's "ஒரு
  // அந்நியன்." / "இனி அந்நியன் இல்லை.") that produced overlapping,
  // illegible double-exposed text through the middle of the transition --
  // directly working against "the motion should make the visual story
  // clearer" (this template's own guiding question). A clean swap keeps
  // exactly one caption legible at every moment, "the only difference
  // should be the motion state" (Part 12) still holds since position/
  // font/color are identical either way.
  ctx.font = `600 ${Math.round(width * 0.042)}px ${tamilFont}`;
  const captionLines = visualT < 0.5 ? layout.captionLines : wrapText(ctx, storyboard.frame5Scene.captionLine, geo.contentWidth);

  ctx.fillStyle = FOREGROUND;
  ctx.font = `600 ${Math.round(width * 0.042)}px ${tamilFont}`;
  drawCappedLines(ctx, captionLines, geo.contentX, layout.stageBottom + layout.captionGap, layout.captionStep, geo.contentBottom);
}
