/**
 * Living Language Story — Text Mask Sampling
 * ----------------------------------------------------------------------------
 * Renders a target string to a DETACHED, never-appended offscreen canvas
 * using the app's own Tamil font, then reads back which pixels the browser's
 * font-shaping engine actually painted. The offscreen canvas itself is never
 * drawn into the visible Living Field canvas -- only the sampled point
 * coordinates are ever used (glyph-assignment.ts consumes them next).
 *
 * Letting the browser/font shape the full string (rather than reconstructing
 * it from individual Unicode components) is what guarantees correct Tamil
 * rendering for conjuncts like ழ்த் -- this module never splits or
 * re-assembles the target text itself; it hands the whole string to
 * `ctx.fillText` in one call and reads the result.
 */

export interface MaskPoint {
  x: number;
  y: number;
}

export interface TextMaskOptions {
  fontFamily: string;
  fontWeight?: number;
  fontSizePx: number;
  /** Grid spacing (px) at which the alpha mask is sampled. Smaller =
   *  denser silhouette = more participating glyphs required from the live
   *  field to read clearly. */
  sampleSpacingPx: number;
  /** Alpha value (0-255) above which a pixel counts as "part of the
   *  glyph." */
  alphaThreshold?: number;
}

/**
 * Renders `text` centred in a `stageWidth` x `stageHeight` offscreen canvas
 * and returns the sampled mask points, in that same coordinate space (i.e.
 * directly comparable to FieldCell.x/y, as long as the caller sized the
 * stage to match the live canvas's own CSS pixel dimensions).
 *
 * Computed once per story start, never per frame (see story-controller.ts).
 */
export function sampleTextMask(
  text: string,
  stageWidth: number,
  stageHeight: number,
  options: TextMaskOptions
): MaskPoint[] {
  if (stageWidth <= 0 || stageHeight <= 0 || text.length === 0) return [];

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(stageWidth));
  canvas.height = Math.max(1, Math.round(stageHeight));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${options.fontWeight ?? 700} ${options.fontSizePx}px ${options.fontFamily}`;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const threshold = options.alphaThreshold ?? 128;
  const step = Math.max(1, Math.round(options.sampleSpacingPx));

  const points: MaskPoint[] = [];
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const alphaIndex = (y * canvas.width + x) * 4 + 3;
      if (data[alphaIndex] >= threshold) {
        points.push({ x, y });
      }
    }
  }
  return points;
}
