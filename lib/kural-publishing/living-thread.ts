/**
 * Living Thread -- a reusable, surface-responsive ambient pattern layer for
 * the Daily Aathichoodi Series carousel. See the founder's own handover
 * brief (LIVING_THREAD_HANDOVER.md, not checked into this repo) for the
 * full spec this implements: a tiled, tinted copy of the AiA compound-
 * diamond motif (living-thread-tile.png, a white-on-transparent mask).
 * flat-tinted per surface colour, revealed only near one or two "anchor"
 * points per surface (a soft radial falloff, never full wallpaper), and
 * kept clear of that surface's own text/icon/CTA/footer content.
 *
 * The brief's own reference implementation assumes a DOM pipeline (one
 * <canvas> layer per surface, composited via z-index, with content boxes
 * read live via getBoundingClientRect). This app has no DOM layout for its
 * exported slides -- every surface, every line of text, is painted
 * directly onto one shared <canvas> by aathichoodi-carousel-renderer.ts.
 * The brief's own explicit fallback for that case ("render the same
 * algorithm server-side... declare keepOut rectangles... derived from the
 * template's layout constants") is what this module follows: every
 * geometry input below (surface rect, anchor points, keep-out rects) is
 * supplied by the caller in absolute canvas-pixel coordinates, already
 * resolved from that renderer's own real layout math (including, where
 * available, the SAME hotspot rectangles the click-to-edit overlay uses --
 * see aathichoodi-carousel-renderer.ts's own applyLivingThread for how).
 *
 * Because every surface shares one canvas and one paint order, the real
 * slide content (drawn by the caller AFTER this layer, every single time)
 * naturally repaints over the pattern wherever it sits -- the keep-out
 * erase below is a defensive, spec-mandated second line of defence (chiefly
 * for the brief's own validation checks and for any semi-transparent
 * overlay that blends with, rather than fully overwrites, what's beneath
 * it), not the only thing standing between the pattern and legibility.
 */

/** Locked colour values, per the handover brief -- the only four colours
 *  that exist in this system. Never read from a per-slide style token:
 *  these are fixed design constants, independent of any carousel design
 *  override. */
const MINT = "#68FFAD";
const WHITE = "#FFFFFF";
const PALE_GREEN = "#EAF2F2";

export type LTSurfaceType = "dark-green" | "pale-green" | "white";

interface LTSurfaceRule {
  threadColor: string;
  defaultIntensity: number;
  range: [number, number];
  toOpacity: (intensity: number) => number;
}

/** Single source of truth for the surface -> thread-colour/opacity rule
 *  (handover brief section 4). White-on-white-adjacent pale green reads as
 *  near-invisible at a literal 10-12% layer opacity (pale green is only
 *  ~8% darker than white), so the white surface's "intensity" is a
 *  perceptual stand-in, converted to a stronger literal layer opacity via
 *  toOpacity -- see the brief's own section 4.2. The other two surfaces
 *  convert 1:1. */
const LT_SURFACE_RULES: Record<LTSurfaceType, LTSurfaceRule> = {
  "dark-green": { threadColor: MINT, defaultIntensity: 0.12, range: [0.08, 0.16], toOpacity: (i) => i },
  "pale-green": { threadColor: WHITE, defaultIntensity: 0.12, range: [0.1, 0.12], toOpacity: (i) => i },
  white: { threadColor: PALE_GREEN, defaultIntensity: 0.11, range: [0.1, 0.12], toOpacity: (i) => Math.min(1, i / 0.17) },
};

/** Resolves a surface type (+ optional intensity override, clamped into
 *  that surface's own allowed range) to the actual thread colour and layer
 *  opacity to draw with. */
export function resolveLivingThreadPaint(
  surface: LTSurfaceType,
  intensityOverride?: number
): { color: string; opacity: number } {
  const rule = LT_SURFACE_RULES[surface];
  const raw = intensityOverride ?? rule.defaultIntensity;
  const clamped = Math.min(rule.range[1], Math.max(rule.range[0], raw));
  return { color: rule.threadColor, opacity: rule.toOpacity(clamped) };
}

export interface LTRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One surface's full Living Thread configuration, already resolved into
 *  absolute canvas-pixel coordinates (everything shares one canvas here,
 *  so there's no separate local/surface-relative coordinate space to
 *  convert between -- see this module's own doc comment). */
export interface LivingThreadLayer {
  /** The surface's own box -- the pattern is clipped to this rect (and
   *  its corner radius), never drawn outside it. */
  rect: LTRect;
  /** Corner radius, matching however the surface itself was drawn
   *  (roundRect's own single-number or four-corner array form). */
  radius: number | [number, number, number, number];
  surface: LTSurfaceType;
  /** Optional intensity override within the surface's allowed range
   *  (handover brief section 4.1); omit for the surface's own default. */
  intensity?: number;
  /** 1-2 accent anchor points, in absolute canvas-pixel coordinates --
   *  each is where one compound-diamond tile centre lands, and the centre
   *  of that accent's own radial reveal. A point outside `rect` is valid
   *  and intentional (an anchor near a corner crops the diamond against
   *  the surface edge, per the brief's own "partial cropping is
   *  intentional"). */
  accents: readonly { x: number; y: number }[];
  /** Content boxes (text, icons, CTAs, footer identity, image frames) to
   *  keep the pattern off, in absolute canvas-pixel coordinates -- see
   *  this module's own doc comment for why this is a defensive second
   *  line of defence here, not the only one. */
  keepOut: readonly LTRect[];
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/** Draws one surface's Living Thread layer directly onto `ctx`, clipped to
 *  `layer.rect`, behind whatever the caller draws next (paint order is the
 *  caller's responsibility -- see this module's own doc comment). Reads
 *  `slideWidth` (not `layer.rect.width`) for the brief's own `k =
 *  slideWidth / 1080` scale factor -- the tile's rendered size is relative
 *  to the whole slide, not to whichever surface happens to host it, so two
 *  differently-sized surfaces on the same slide still show the same tile
 *  scale. */
export function drawLivingThread(
  ctx: CanvasRenderingContext2D,
  tile: HTMLImageElement,
  slideWidth: number,
  layer: LivingThreadLayer
): void {
  if (layer.accents.length === 0) return;
  const { rect, radius } = layer;
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));

  const { color, opacity } = resolveLivingThreadPaint(layer.surface, layer.intensity);

  // Handover brief section 5.2 -- every size is proportional to the whole
  // slide's width, not this one surface's own box.
  const k = slideWidth / 1080;
  const T = 408 * k;
  const r0 = 0.75 * T;
  const r1 = 1.15 * T;
  const keepOutPad = 40 * k;
  const keepOutBlur = 28 * k;

  const layerCanvas = document.createElement("canvas");
  layerCanvas.width = w;
  layerCanvas.height = h;
  const lctx = layerCanvas.getContext("2d");
  if (!lctx) return;

  for (const anchor of layer.accents) {
    const ax = anchor.x - rect.x;
    const ay = anchor.y - rect.y;

    const accentCanvas = document.createElement("canvas");
    accentCanvas.width = w;
    accentCanvas.height = h;
    const actx = accentCanvas.getContext("2d");
    if (!actx) continue;

    // 1) Tile grid aligned so one diamond's own centre sits on the anchor.
    const ox = mod(ax - T / 2, T) - T;
    const oy = mod(ay - T / 2, T) - T;
    for (let y = oy; y < h; y += T) {
      for (let x = ox; x < w; x += T) {
        actx.drawImage(tile, x, y, T, T);
      }
    }

    // 2) Flat tint -- the tile is a white-on-transparent mask, so this
    // replaces its ink with the surface's own thread colour, alpha intact.
    actx.globalCompositeOperation = "source-in";
    actx.fillStyle = color;
    actx.fillRect(0, 0, w, h);

    // 3) Edge-accent reveal -- opaque to r0, linear falloff to 0 at r1, so
    // this reads as one anchored diamond (plus its spacer neighbour), not
    // wallpaper.
    actx.globalCompositeOperation = "destination-in";
    const reveal = actx.createRadialGradient(ax, ay, 0, ax, ay, Math.max(1, r1));
    reveal.addColorStop(0, "rgba(0,0,0,1)");
    reveal.addColorStop(Math.min(1, r0 / r1), "rgba(0,0,0,1)");
    reveal.addColorStop(1, "rgba(0,0,0,0)");
    actx.fillStyle = reveal;
    actx.fillRect(0, 0, w, h);

    lctx.drawImage(accentCanvas, 0, 0);
  }

  // 4) Keep-out -- feathered erase around every known content box on this
  // surface, in case the paint order behind this call doesn't already
  // fully cover it (see this module's own doc comment).
  if (layer.keepOut.length > 0) {
    lctx.globalCompositeOperation = "destination-out";
    lctx.filter = `blur(${keepOutBlur}px)`;
    lctx.fillStyle = "#000000";
    for (const box of layer.keepOut) {
      lctx.fillRect(
        box.x - rect.x - keepOutPad,
        box.y - rect.y - keepOutPad,
        box.width + keepOutPad * 2,
        box.height + keepOutPad * 2
      );
    }
    lctx.filter = "none";
    lctx.globalCompositeOperation = "source-over";
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
  ctx.clip();
  ctx.globalAlpha = opacity;
  ctx.drawImage(layerCanvas, rect.x, rect.y);
  ctx.restore();
}
