/**
 * Distant Devotion — Asset Generator: Purananuru Reel Storyboard Renderer
 * ----------------------------------------------------------------------------
 * LOCKED BUILD. A SECOND, independent Purananuru template alongside (never
 * replacing) purananuru-carousel-renderer.ts's 2-slide card. This one draws
 * the 7-frame teaching journey (Parent Hook / Modern Child Situation /
 * Human Action / Tamil Discovery / Aram / How To Teach / Practise & Pass It
 * On -- PURANANURU_REEL_FRAME_LABELS below is the source of truth for the
 * exact wording) as static, full-bleed 1080x1920 (9:16) PNGs -- still no
 * animation, video, or image generation, exactly like the Carousel. Both
 * templates are consumed the same way: they take the SAME ComposedPoem
 * produced by content-engine.ts's loadPoem/generateNextPoem (untouched by
 * this file) and derive their own per-frame view from it -- this one via
 * buildComposedReelStoryboard (purananuru/reel-storyboard-content.ts),
 * which never duplicates canon.ts's literary text, only slices it by line
 * range.
 *
 * VISUAL GENERATION MODEL (locked): 2 cinematic AI image prompts (see
 * reel-ai-visual-direction.ts) + 7 editorial frames. This renderer never
 * draws an AI-generated photo -- there is no image asset to draw; a human
 * pastes the two copyable prompts into an external tool and assembles the
 * final reel outside this app, exactly like every other AI-prompt surface
 * in this codebase (aathichoodi/family-image-prompt.ts's own header: "This
 * app never generates or fetches images itself"). What this renderer draws
 * for Frames 1-3 is the TEXT layer of the storyboard kit -- the hook, the
 * modern situation, the living Tamil moment -- the same premium editorial
 * typography treatment every other frame already uses, not a placeholder
 * illustration of the photo.
 *
 * OBSOLETE LOGIC REMOVED: this file used to also draw six abstract,
 * geometric "visual scene" compositions (silhouettes, columns, connector
 * arcs) for a Frame 2 / Frame 5 pair, and export a parallel motion-preview
 * renderer that animated between them. Both are gone: reel-storyboard-
 * content.ts no longer has a ReelVisualScene type for them to draw, Phase
 * 9A's ReelMotionDirection is gone with it, and purananuru-reel-motion-
 * preview-renderer.ts / components/kural-publishing/useReelMotionPreview.ts
 * have been deleted outright rather than left as a competing, now-broken
 * visual-generation path. There is exactly one static strategy now: 2
 * cinematic AI assets (prompts only) + 7 editorial frames, described above.
 *
 * Deliberately NOT a stretched copy of the Carousel's card-on-background
 * look: the Carousel insets a white card inside a tinted frame; this
 * template is full-bleed (background IS the frame, safe margins only) with
 * its own chrome -- a small "PURANANURU" kicker + a page indicator
 * ("03 / 07 · HUMAN ACTION") repeated, in the same position, on every
 * frame, which is what actually reads as "one designed system" across
 * seven images rather than "one card resized seven times." Frame 6 ("How
 * To Teach") inverts to a full indigo panel to give the sequence a visual
 * pause before the calm Frame 7 close -- the one deliberate visual-rhythm
 * break in an otherwise restrained, editorial system.
 *
 * Same indigo brand hue as purananuru-carousel-renderer.ts (so the two
 * templates read as one Purananuru identity), reusing the same generic,
 * content-agnostic seeded-random.ts / ambient-language-layer.ts helpers for
 * its background texture -- never aathichoodi-renderer.ts or
 * aathichoodi-carousel-renderer.ts, which this file does not import from or
 * modify.
 *
 * STATIC ARCHITECTURE ONLY: no animation, motion, transitions, video, or
 * audio in this phase -- that is explicitly the next phase's own work.
 */

import { createSeededRandom } from "./seeded-random";
import {
  drawAmbientLanguageLayer,
  extractTamilGraphemes,
} from "./ambient-language-layer";
import type { ComposedPoem } from "./purananuru/content-engine";
import {
  buildComposedReelStoryboard,
  type ComposedReelStoryboard,
  type LivingTamilMoment,
} from "./purananuru/reel-storyboard-content";

export const BG = "#F4F3F8";
export const FOREGROUND = "#1E1B2E";
export const MUTED = "#6B6B85";
export const PRIMARY = "#3B3F8C";
export const BORDER = "#DADCE8";
const ON_PRIMARY = "#FFFFFF";
const ON_PRIMARY_MUTED = "#C7C9EE";
const WARNING = "#8A5A00";

const FALLBACK_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

export const PURANANURU_REEL_FRAME_COUNT = 7;
export const PURANANURU_REEL_FRAME_LABELS: readonly string[] = [
  "Parent Hook",
  "Modern Situation",
  "Human Action",
  "Tamil Discovery",
  "Aram",
  "How To Teach",
  "Practise",
];
/** Filename slugs, index-aligned with PURANANURU_REEL_FRAME_LABELS --
 *  exported so PublishingWorkspace's filename builder never hand-types
 *  these separately from the labels shown in the UI. */
export const PURANANURU_REEL_FRAME_SLUGS: readonly string[] = [
  "hook",
  "situation",
  "action",
  "discovery",
  "aram",
  "teach",
  "practise",
];

export interface RenderPurananuruReelOptions {
  width: number;
  height: number;
  /** The same ComposedPoem the 2-slide Carousel renders -- this template
   *  derives its own content from it via buildComposedReelStoryboard,
   *  rather than PublishingWorkspace passing a second, differently-shaped
   *  content object. */
  poem: ComposedPoem;
  /** 0-6, indexing PURANANURU_REEL_FRAME_LABELS. */
  frameIndex: number;
  tamilFont: string;
  sansFont: string;
  /** Frame 7 (Practise / Pass It On) only -- the one frame with any brand
   *  mark at all (see this file's own header: "keep branding subtle" is
   *  honored by omitting it from every other frame, not by shrinking it
   *  everywhere). */
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) {
    end--;
  }
  return `${text.slice(0, end).trimEnd()}…`;
}

/** Draws already-wrapped lines starting at startY, stepping by lineStep,
 *  and stops (truncating the last drawn line with an ellipsis) before
 *  crossing maxY -- the same overflow-safety convention
 *  purananuru-carousel-renderer.ts uses, reapplied here so long content can
 *  never clip against this template's own footer/margin. Returns the Y
 *  position after the last line actually drawn. */
export function drawCappedLines(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x: number,
  startY: number,
  lineStep: number,
  maxY: number
): number {
  let y = startY;
  for (let i = 0; i < lines.length; i++) {
    const nextY = y + lineStep;
    if (nextY > maxY) break;
    y = nextY;
    const isLastAllowed = nextY + lineStep > maxY;
    const truncated = isLastAllowed && i < lines.length - 1;
    ctx.fillText(truncated ? `${lines[i]}…` : lines[i], x, y);
    if (truncated) break;
  }
  return y;
}

export interface FrameGeometry {
  marginX: number;
  contentX: number;
  contentWidth: number;
  contentTop: number;
  contentBottom: number;
}

/** Shared chrome every frame draws first: full-bleed background, a small
 *  "PURANANURU" kicker top-left, and a page indicator ("03 / 07 · HUMAN
 *  ACTION") top-right -- the one repeated element that makes seven separate
 *  PNGs read as a single designed sequence rather than seven unrelated
 *  cards. `invert` flips both the background and the chrome text color for
 *  Frame 6's full-indigo panel. */
export function drawFrameChrome(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameIndex: number,
  sansFont: string,
  invert: boolean
): FrameGeometry {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = invert ? PRIMARY : BG;
  ctx.fillRect(0, 0, width, height);

  const marginX = width * 0.09;
  const marginTop = height * 0.045;
  const marginBottom = height * 0.055;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = invert ? ON_PRIMARY_MUTED : MUTED;
  ctx.font = `600 ${Math.round(width * 0.026)}px ${sansFont}`;
  ctx.textAlign = "left";
  ctx.fillText("PURANANURU", marginX, marginTop + width * 0.026);

  const pageLabel = `${String(frameIndex + 1).padStart(2, "0")} / ${String(PURANANURU_REEL_FRAME_COUNT).padStart(2, "0")} · ${PURANANURU_REEL_FRAME_LABELS[frameIndex].toUpperCase()}`;
  ctx.textAlign = "right";
  ctx.fillText(truncateToWidth(ctx, pageLabel, width * 0.55), width - marginX, marginTop + width * 0.026);
  ctx.textAlign = "left";

  return {
    marginX,
    contentX: marginX,
    contentWidth: width - marginX * 2,
    contentTop: marginTop + height * 0.05,
    contentBottom: height - marginBottom,
  };
}

/** One block of pre-measured rows, all sharing one font/color/step, used
 *  by the "measure everything first, then center the whole stack" layout
 *  every frame below follows -- the same discipline drawPurananuruFrame
 *  already used for its own Tamil/transliteration rows, generalized so
 *  Frame 4 (Tamil Discovery, now carrying English intro/meaning text
 *  around the verse too) doesn't need a bespoke one-off implementation. */
interface TextBlock {
  lines: string[];
  step: number;
  font: string;
  color: string;
  /** Extra vertical space inserted BEFORE this block (0 for the first
   *  block in a stack). */
  gapBefore: number;
}

function blockHeight(block: TextBlock): number {
  return block.lines.length ? block.gapBefore + block.lines.length * block.step : 0;
}

function drawTextBlocks(ctx: CanvasRenderingContext2D, blocks: readonly TextBlock[], x: number, startY: number, maxY: number): number {
  let y = startY;
  for (const block of blocks) {
    if (!block.lines.length) continue;
    y += block.gapBefore;
    ctx.font = block.font;
    ctx.fillStyle = block.color;
    y = drawCappedLines(ctx, block.lines, x, y, block.step, maxY);
  }
  return y;
}

/** Frame 1 (Parent Hook). The hook question, and -- when this poem has
 *  one -- the living Tamil moment as a hero payoff beneath it (Tamil,
 *  Tanglish, English). Falls back to a hook-only frame when no
 *  livingTamilMoment is authored for this poem (see reel-storyboard-
 *  content.ts's own doc comment: it is deliberately optional). */
function drawParentHookFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  const hookFont = `700 ${Math.round(width * 0.058)}px ${tamilFont}`;
  ctx.font = hookFont;
  const hookBlock: TextBlock = {
    lines: wrapText(ctx, storyboard.hook, geo.contentWidth),
    step: width * 0.078,
    font: hookFont,
    color: FOREGROUND,
    gapBefore: 0,
  };

  const blocks: TextBlock[] = [hookBlock];
  if (storyboard.livingTamilMoment) {
    blocks.push(...buildLivingTamilMomentBlocks(ctx, opts, geo, storyboard.livingTamilMoment, height * 0.055));
  }

  const totalHeight = blocks.reduce((sum, b) => sum + blockHeight(b), 0);
  const available = geo.contentBottom - geo.contentTop;
  const startY = geo.contentTop + Math.max(0, (available - totalHeight) / 2);
  drawTextBlocks(ctx, blocks, geo.contentX, startY, geo.contentBottom);
}

/** Shared by Frame 1 and Frame 3: the living Tamil phrase itself (large,
 *  primary color), its Tanglish pronunciation (italic, muted), and its
 *  English meaning in quotes -- one reusable set of TextBlocks so both
 *  frames render the SAME phrase identically rather than two
 *  independently-tuned implementations. */
function buildLivingTamilMomentBlocks(
  ctx: CanvasRenderingContext2D,
  opts: RenderPurananuruReelOptions,
  geo: FrameGeometry,
  moment: LivingTamilMoment,
  gapBefore: number
): TextBlock[] {
  const { width, tamilFont, sansFont } = opts;
  const blocks: TextBlock[] = [];

  const tamilFontStr = `700 ${Math.round(width * 0.074)}px ${tamilFont}`;
  ctx.font = tamilFontStr;
  blocks.push({
    lines: wrapText(ctx, moment.tamil, geo.contentWidth),
    step: width * 0.096,
    font: tamilFontStr,
    color: PRIMARY,
    gapBefore,
  });

  if (moment.transliteration) {
    const translitFontStr = `italic 500 ${Math.round(width * 0.032)}px ${sansFont}`;
    ctx.font = translitFontStr;
    blocks.push({
      lines: wrapText(ctx, moment.transliteration, geo.contentWidth),
      step: width * 0.046,
      font: translitFontStr,
      color: MUTED,
      gapBefore: width * 0.02,
    });
  }

  const englishFontStr = `500 ${Math.round(width * 0.036)}px ${sansFont}`;
  ctx.font = englishFontStr;
  blocks.push({
    lines: wrapText(ctx, `"${moment.english}"`, geo.contentWidth),
    step: width * 0.05,
    font: englishFontStr,
    color: FOREGROUND,
    gapBefore: width * 0.024,
  });

  return blocks;
}

/** Frame 2 (Modern Child Situation) and Frame 6 (How To Teach) share this
 *  layout: a small kicker, then a multi-paragraph body (paragraph breaks
 *  are literal blank lines in the source string -- wrapText already
 *  renders an empty rawLine as a blank spacer line, so `\n\n` in the
 *  content just works). `invert` supports Frame 6's own indigo panel
 *  treatment. */
function drawKickerBodyFrame(
  ctx: CanvasRenderingContext2D,
  opts: RenderPurananuruReelOptions,
  kickerTamil: string,
  kickerEnglish: string,
  bodyLine: string,
  invert: boolean
) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, invert);

  ctx.fillStyle = invert ? ON_PRIMARY_MUTED : PRIMARY;
  ctx.font = `600 ${Math.round(width * 0.03)}px ${sansFont}`;
  ctx.fillText(`${kickerTamil} · ${kickerEnglish.toUpperCase()}`, geo.contentX, geo.contentTop);

  const bodyFont = `500 ${Math.round(width * 0.046)}px ${tamilFont}`;
  ctx.font = bodyFont;
  const lineStep = width * 0.064;
  const lines = wrapText(ctx, bodyLine, geo.contentWidth);
  const blockH = lines.length * lineStep;
  const startY = geo.contentTop + (geo.contentBottom - geo.contentTop) / 2 - blockH / 2 + width * 0.04;

  ctx.fillStyle = invert ? ON_PRIMARY : FOREGROUND;
  ctx.font = bodyFont;
  drawCappedLines(ctx, lines, geo.contentX, startY, lineStep, geo.contentBottom);
}

function drawModernSituationFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  drawKickerBodyFrame(ctx, opts, "இன்றைய நிலை", "Modern Situation", storyboard.modernSituation, false);
}

/** Frame 3 (Human Action). The simple action in one line, then -- when
 *  this poem has one -- the SAME living Tamil moment Frame 1 already
 *  introduced, repeated here as the payoff (reel-storyboard-content.ts's
 *  own doc comment: "introduced as Frame 1's hero payoff, then repeated as
 *  Frame 3's own action beat"). Never a second, independently-authored
 *  phrase. */
function drawHumanActionFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  ctx.fillStyle = PRIMARY;
  ctx.font = `600 ${Math.round(width * 0.03)}px ${sansFont}`;
  ctx.fillText("செயல் · HUMAN ACTION", geo.contentX, geo.contentTop);

  const actionFont = `500 ${Math.round(width * 0.044)}px ${tamilFont}`;
  ctx.font = actionFont;
  const actionBlock: TextBlock = {
    lines: wrapText(ctx, storyboard.modernAction, geo.contentWidth),
    step: width * 0.06,
    font: actionFont,
    color: FOREGROUND,
    gapBefore: 0,
  };

  const blocks: TextBlock[] = [actionBlock];
  if (storyboard.livingTamilMoment) {
    blocks.push(...buildLivingTamilMomentBlocks(ctx, opts, geo, storyboard.livingTamilMoment, height * 0.05));
  }

  const totalHeight = blocks.reduce((sum, b) => sum + blockHeight(b), 0);
  const available = geo.contentBottom - geo.contentTop;
  const startY = geo.contentTop + Math.max(0, (available - totalHeight) / 2) + width * 0.02;
  drawTextBlocks(ctx, blocks, geo.contentX, startY, geo.contentBottom);
}

/** Frame 4 (Tamil Discovery). "This wisdom isn't new" -- an English intro
 *  line, the verified canonical Tamil excerpt (never retyped, always
 *  sliced live from canon.ts), its Tanglish transliteration, and a concise
 *  English meaning gloss -- everything the old, separate "Purananuru" and
 *  "Meaning" frames used to carry, now one frame (the new 7-frame grammar
 *  needs the freed slots for Frames 2/3/5). The UNVERIFIED safeguard is
 *  preserved exactly as before. */
function drawTamilDiscoveryFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(width * 0.026)}px ${sansFont}`;
  ctx.fillText(
    truncateToWidth(ctx, `புறநானூறு ${storyboard.poemNumber} · ${storyboard.poet.toUpperCase()}`, geo.contentWidth),
    geo.contentX,
    geo.contentTop
  );

  const introFont = `500 ${Math.round(width * 0.036)}px ${sansFont}`;
  ctx.font = introFont;
  const introBlock: TextBlock = {
    lines: wrapText(ctx, storyboard.discoveryIntro, geo.contentWidth),
    step: width * 0.05,
    font: introFont,
    color: PRIMARY,
    gapBefore: height * 0.045,
  };

  const normalFont = `500 ${Math.round(width * 0.044)}px ${tamilFont}`;
  const emphasizedFont = `700 ${Math.round(width * 0.05)}px ${tamilFont}`;
  const tamilStep = width * 0.062;
  const emphasizedStep = width * 0.075;

  const tamilLines: string[] = [];
  const tamilRowIsEmphasized: boolean[] = [];
  for (let i = 0; i < storyboard.excerptTamilLines.length; i++) {
    const emphasized = i === storyboard.emphasizeExcerptIndex;
    ctx.font = emphasized ? emphasizedFont : normalFont;
    for (const wline of wrapText(ctx, storyboard.excerptTamilLines[i], geo.contentWidth)) {
      tamilLines.push(wline);
      tamilRowIsEmphasized.push(emphasized);
    }
  }
  // Tamil rows mix two font sizes, so they're drawn as individual
  // single-line blocks (one TextBlock per row) rather than one shared
  // TextBlock -- drawTextBlocks below still lays them out in the same
  // "measure everything, then draw in one pass" stack as every other
  // block on this frame.
  const tamilBlocks: TextBlock[] = tamilLines.map((line, i) => ({
    lines: [line],
    step: tamilRowIsEmphasized[i] ? emphasizedStep : tamilStep,
    font: tamilRowIsEmphasized[i] ? emphasizedFont : normalFont,
    color: tamilRowIsEmphasized[i] ? PRIMARY : FOREGROUND,
    gapBefore: i === 0 ? height * 0.03 : 0,
  }));

  const translitFont = `italic 400 ${Math.round(width * 0.024)}px ${sansFont}`;
  ctx.font = translitFont;
  const translitBlock: TextBlock = {
    lines: storyboard.excerptTransliterationLines ? [...storyboard.excerptTransliterationLines] : [],
    step: width * 0.033,
    font: translitFont,
    color: MUTED,
    gapBefore: height * 0.02,
  };

  const meaningFont = `500 ${Math.round(width * 0.032)}px ${sansFont}`;
  ctx.font = meaningFont;
  const meaningBlock: TextBlock = {
    lines: wrapText(ctx, storyboard.discoveryMeaning, geo.contentWidth),
    step: width * 0.046,
    font: meaningFont,
    color: FOREGROUND,
    gapBefore: height * 0.035,
  };

  const blocks: TextBlock[] = [introBlock, ...tamilBlocks, translitBlock, meaningBlock];
  const badgeReserve = storyboard.verified ? 0 : height * 0.045;
  const blockTop = geo.contentTop + height * 0.04;
  const blockBottom = geo.contentBottom - badgeReserve;
  const totalHeight = blocks.reduce((sum, b) => sum + blockHeight(b), 0);
  const available = Math.max(0, blockBottom - blockTop);
  const startY = blockTop + Math.max(0, (available - totalHeight) / 2);
  drawTextBlocks(ctx, blocks, geo.contentX, startY, blockBottom);

  if (!storyboard.verified) {
    ctx.fillStyle = WARNING;
    ctx.font = `600 ${Math.round(width * 0.021)}px ${sansFont}`;
    ctx.fillText("⚠ UNVERIFIED — confirm against source before publishing", geo.contentX, geo.contentBottom);
  }
}

/** Frame 5 (Aram) -- the value, explicitly named, never left an invisible
 *  layer. "அறம்" itself is a fixed, universal label drawn on every poem's
 *  Frame 5 (not authored per poem -- it is simply the Tamil word for this
 *  frame's own role, the same "fixed role kicker" convention the other
 *  frames already use); `aram.value`/`aram.explanation` are the only
 *  poem-specific content. */
function drawAramFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  const aramWordFont = `700 ${Math.round(width * 0.09)}px ${tamilFont}`;
  const valueFont = `600 ${Math.round(width * 0.05)}px ${sansFont}`;
  const explanationFont = `500 ${Math.round(width * 0.038)}px ${tamilFont}`;

  ctx.font = valueFont;
  const valueLines = wrapText(ctx, storyboard.aram.value, geo.contentWidth);
  ctx.font = explanationFont;
  const explanationLines = wrapText(ctx, storyboard.aram.explanation, geo.contentWidth);

  const blocks: TextBlock[] = [
    { lines: ["அறம்"], step: width * 0.11, font: aramWordFont, color: PRIMARY, gapBefore: 0 },
    { lines: valueLines, step: width * 0.066, font: valueFont, color: FOREGROUND, gapBefore: height * 0.045 },
    { lines: explanationLines, step: width * 0.054, font: explanationFont, color: FOREGROUND, gapBefore: height * 0.03 },
  ];

  const totalHeight = blocks.reduce((sum, b) => sum + blockHeight(b), 0);
  const available = geo.contentBottom - geo.contentTop;
  const startY = geo.contentTop + Math.max(0, (available - totalHeight) / 2);
  drawTextBlocks(ctx, blocks, geo.contentX, startY, geo.contentBottom);
}

/** Frame 6 (How To Teach). The one deliberate visual-rhythm break in the
 *  sequence: a full-indigo panel, inverted chrome, so the practical
 *  teaching question gets a visibly different moment than the calm,
 *  off-white frames around it -- same treatment this frame's role has
 *  always had in this template, just carrying the new teachingQuestion
 *  content. */
function drawTeachingFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  drawKickerBodyFrame(ctx, opts, "கற்பிப்போம்", "How To Teach", storyboard.teachingQuestion, true);
}

/** Frame 7 (Practise / Pass It On). Tamil heritage -> family practice ->
 *  next generation, one configurable CTA, and the brand mark -- the only
 *  frame in the sequence carrying any brand mark at all (see this file's
 *  own header). */
function drawPracticeFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  const rand = createSeededRandom(storyboard.poemNumber);
  drawAmbientLanguageLayer(ctx, {
    width,
    height,
    rand,
    font: tamilFont,
    glyphPool: (() => {
      const pool = extractTamilGraphemes(storyboard.excerptTamilLines.join(" "));
      return pool.length > 0 ? pool : FALLBACK_GLYPHS;
    })(),
    color: PRIMARY,
    clearBox: { x: 0, y: 0, width, height },
  });

  const heritageFont = `600 ${Math.round(width * 0.046)}px ${tamilFont}`;
  ctx.font = heritageFont;
  const heritageBlock: TextBlock = {
    lines: wrapText(ctx, storyboard.heritageStatement, geo.contentWidth),
    step: width * 0.062,
    font: heritageFont,
    color: FOREGROUND,
    gapBefore: 0,
  };

  const ctaFont = `600 ${Math.round(width * 0.032)}px ${sansFont}`;
  ctx.font = ctaFont;
  const ctaBlock: TextBlock = {
    lines: wrapText(ctx, storyboard.cta.label, geo.contentWidth),
    step: width * 0.046,
    font: ctaFont,
    color: PRIMARY,
    gapBefore: height * 0.04,
  };

  const brandReserve = opts.brandingWordmark ? height * 0.06 : 0;
  const blockTop = geo.contentTop;
  const blockBottom = geo.contentBottom - brandReserve;
  const blocks = [heritageBlock, ctaBlock];
  const totalHeight = blocks.reduce((sum, b) => sum + blockHeight(b), 0);
  const available = Math.max(0, blockBottom - blockTop);
  const startY = blockTop + Math.max(0, (available - totalHeight) / 2);
  drawTextBlocks(ctx, blocks, geo.contentX, startY, blockBottom);

  if (opts.brandingWordmark) {
    const brandY = geo.contentBottom;
    if (opts.logoImage) {
      const logoH = height * 0.024;
      const logoW = logoH * (opts.logoImage.width / opts.logoImage.height);
      ctx.drawImage(opts.logoImage, geo.contentX, brandY - logoH * 0.85, logoW, logoH);
      ctx.fillStyle = MUTED;
      ctx.font = `500 ${Math.round(width * 0.024)}px ${sansFont}`;
      ctx.fillText(opts.brandingWordmark, geo.contentX + logoW + width * 0.02, brandY);
    } else {
      ctx.fillStyle = MUTED;
      ctx.font = `500 ${Math.round(width * 0.024)}px ${sansFont}`;
      ctx.fillText(opts.brandingWordmark, geo.contentX, brandY);
    }
  }
}

function drawUnavailableFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions) {
  const { width, height, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);
  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(width * 0.032)}px ${sansFont}`;
  drawCappedLines(
    ctx,
    wrapText(ctx, `No Reel Storyboard content has been authored yet for poem ${opts.poem.poemNumber}.`, geo.contentWidth),
    geo.contentX,
    geo.contentTop + height * 0.1,
    width * 0.045,
    geo.contentBottom
  );
}

export function renderPurananuruReelFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions): void {
  const storyboard = buildComposedReelStoryboard(opts.poem);
  if (!storyboard) {
    drawUnavailableFrame(ctx, opts);
    return;
  }
  switch (opts.frameIndex) {
    case 0:
      drawParentHookFrame(ctx, opts, storyboard);
      break;
    case 1:
      drawModernSituationFrame(ctx, opts, storyboard);
      break;
    case 2:
      drawHumanActionFrame(ctx, opts, storyboard);
      break;
    case 3:
      drawTamilDiscoveryFrame(ctx, opts, storyboard);
      break;
    case 4:
      drawAramFrame(ctx, opts, storyboard);
      break;
    case 5:
      drawTeachingFrame(ctx, opts, storyboard);
      break;
    default:
      drawPracticeFrame(ctx, opts, storyboard);
  }
}

/** Fully independent export render, same pattern as
 *  renderPurananuruCarouselSlideForExport: fresh off-screen canvas at exact
 *  output dimensions, returns a PNG Blob. */
export async function renderPurananuruReelFrameForExport(
  poem: ComposedPoem,
  frameIndex: number,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: { tamilFont: string; sansFont: string },
  brandingWordmark?: string,
  brandingHandle?: string
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* fallback chain already in place */
    }
  }

  renderPurananuruReelFrame(ctx, {
    width: format.width,
    height: format.height,
    poem,
    frameIndex,
    ...fonts,
    logoImage,
    brandingWordmark: format.branding ? brandingWordmark : undefined,
    brandingHandle: format.branding ? brandingHandle : undefined,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
