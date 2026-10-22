/**
 * Kinetic Typography Engine — Renderer
 * ----------------------------------------------------------------------------
 * The one generic draw function: evaluate every word's own keyframe
 * track at a point in time, then paint them in drawOrder. No word text,
 * mood, or stage name is referenced anywhere in this file -- everything
 * it draws comes from the KineticScript data the caller provides.
 *
 * Same Canvas2D primitives already proven in the Phase 1/2 kinetic-reel-
 * poc renderer (translate -> rotate -> scale -> ctx.filter blur ->
 * fillText, inside a save/restore per word) -- generalized so EVERY word
 * can use them, not just one hardcoded "focal" role per line.
 *
 * Deterministic and stateless: drawKineticFrame(ctx, script, t) always
 * paints the same frame for the same t, so live preview, scrubbing, and
 * frame-by-frame video capture all share this one function.
 */

import type { CompositionSpec, KineticScript, WordSpec } from "./types";
import { applyEasing, clamp01, lerp } from "./easing";

interface ResolvedWord {
  text: string;
  color: string;
  weight: number;
  sizePx: number;
  drawOrder: number;
  x: number;
  y: number;
  rotationRad: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  blurPx: number;
}

/** Evaluates one word's keyframe track at `tComp` (seconds since the
 *  word's OWN composition started). Returns null before the word's
 *  first keyframe (not entered yet); holds at the last keyframe's
 *  values once tComp passes it -- the engine's built-in "readable hold,"
 *  not something a caller has to remember to add. */
function resolveWordAt(word: WordSpec, tComp: number): ResolvedWord | null {
  const kfs = word.keyframes;
  if (!kfs.length) return null;
  if (tComp < kfs[0].atSec) return null;

  let i = 0;
  while (i < kfs.length - 1 && tComp >= kfs[i + 1].atSec) i++;
  const a = kfs[i];
  const b = kfs[Math.min(i + 1, kfs.length - 1)];

  const base = { text: word.text, color: word.color, weight: word.weight, sizePx: word.sizePx, drawOrder: word.drawOrder };

  if (a === b || tComp >= b.atSec) {
    const last = kfs[kfs.length - 1];
    return { ...base, x: last.x, y: last.y, rotationRad: last.rotationRad, scaleX: last.scaleX, scaleY: last.scaleY, opacity: last.opacity, blurPx: last.blurPx };
  }

  const span = Math.max(0.0001, b.atSec - a.atSec);
  const raw = clamp01((tComp - a.atSec) / span);
  const e = applyEasing(b.easing, raw);
  return {
    ...base,
    x: lerp(a.x, b.x, e),
    y: lerp(a.y, b.y, e),
    rotationRad: lerp(a.rotationRad, b.rotationRad, e),
    scaleX: lerp(a.scaleX, b.scaleX, e),
    scaleY: lerp(a.scaleY, b.scaleY, e),
    opacity: lerp(a.opacity, b.opacity, e),
    blurPx: lerp(a.blurPx, b.blurPx, e),
  };
}

function drawWord(ctx: CanvasRenderingContext2D, w: ResolvedWord, fontFamily: string): void {
  if (w.opacity <= 0.002) return;
  ctx.font = `${w.weight} ${Math.round(w.sizePx)}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.save();
  ctx.globalAlpha = clamp01(w.opacity);
  ctx.translate(w.x, w.y);
  ctx.rotate(w.rotationRad);
  ctx.scale(w.scaleX, w.scaleY);
  if (w.blurPx > 0.4) ctx.filter = `blur(${w.blurPx.toFixed(1)}px)`;
  ctx.fillStyle = w.color;
  ctx.fillText(w.text, 0, 0);
  ctx.filter = "none";
  ctx.restore();
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawBackground(ctx: CanvasRenderingContext2D, script: KineticScript, comp: CompositionSpec): void {
  ctx.clearRect(0, 0, script.width, script.height);
  ctx.fillStyle = comp.backgroundColor;
  ctx.fillRect(0, 0, script.width, script.height);
  if (comp.vignetteColor) {
    const g = ctx.createRadialGradient(
      script.width / 2, script.height / 2, script.height * 0.16,
      script.width / 2, script.height / 2, script.height * 0.8
    );
    g.addColorStop(0, hexWithAlpha(comp.vignetteColor, 0));
    g.addColorStop(1, hexWithAlpha(comp.vignetteColor, comp.vignetteAlpha ?? 0.05));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, script.width, script.height);
  }
}

/** Draws one frame at `elapsedSec` (clamped to the script's own
 *  duration). Finds the active composition by absolute time, then
 *  resolves and paints each of its words at composition-local time, in
 *  drawOrder -- a hard cut between compositions, no cross-fade, matching
 *  how the reference material itself moves between distinct layouts. */
export function drawKineticFrame(ctx: CanvasRenderingContext2D, script: KineticScript, elapsedSec: number): void {
  const t = Math.max(0, Math.min(elapsedSec, script.durationSec));
  const comp =
    script.compositions.find((c) => t >= c.startSec && t < c.endSec) ?? script.compositions[script.compositions.length - 1];
  const tComp = t - comp.startSec;

  drawBackground(ctx, script, comp);

  const resolved = comp.words
    .map((w) => resolveWordAt(w, tComp))
    .filter((w): w is ResolvedWord => w !== null)
    .sort((a, b) => a.drawOrder - b.drawOrder);

  for (const w of resolved) drawWord(ctx, w, script.fontFamily);
}
