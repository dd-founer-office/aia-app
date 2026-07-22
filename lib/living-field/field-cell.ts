/**
 * Living Kernel — Field Cell (shared data contract)
 * ----------------------------------------------------------------------------
 * Living Kernel v1.0 architecture hardening pass.
 *
 * `FieldCell` is not any single engine's private concern -- it's the shared,
 * progressively-enriched record every engine in the pipeline writes one more
 * piece of metadata onto, and the Renderer ultimately reads in full. Before
 * this pass, its type definition lived inside field-layout.ts (Field Engine
 * + Civilization Engine's file), which meant that file had to import
 * type-level knowledge of every DOWNSTREAM engine (affinity-types.ts,
 * harmony-types.ts) just to declare the optional fields those later stages
 * would populate. That's harmless today (type-only, zero runtime coupling,
 * Field Engine's actual logic never reads `.affinity` or `.harmony`) but it
 * doesn't scale cleanly: every future engine added to the pipeline would
 * force ANOTHER type import into Field Engine's own file, regardless of how
 * unrelated Field Engine is to that new engine's concern.
 *
 * Moving the shared contract here fixes that permanently: this file is where
 * a new engine's optional metadata field gets added going forward, not
 * wherever the base type happened to be first defined.
 *
 * ---------------------------------------------------------------------------
 * WHO OWNS WHAT ON THIS TYPE (see LivingKernelArchitecture.md for the full
 * constitution -- this is the quick per-field reference)
 * ---------------------------------------------------------------------------
 *   x, y, col, row      -- Field Engine (generateFieldSlots, field-layout.ts),
 *                           refined by Natural Distribution (x, y only)
 *   stratum             -- Field Engine
 *   glyph, scriptId      -- Civilization Engine (dealGlyphForStratum, field-layout.ts)
 *   affinity             -- Affinity Engine (affinity-engine.ts)
 *   harmony              -- Harmony Engine (emergent-harmony.ts)
 *   expression           -- Ambient Expression Bridge (ambient-expression.ts),
 *                           on demand, not during the normal build pipeline
 *
 * No engine other than the one listed above ever WRITES to its field. Every
 * later engine may READ any earlier engine's fields; no engine reads a field
 * only a LATER engine writes (Principle 2: data flows one direction).
 */

import type { FieldStratum } from "./config";
import type { Glyph } from "./glyphs";
import type { GlyphAffinity } from "./affinity-types";
import type { GlyphHarmony } from "./harmony-types";
import type { GlyphExpression } from "./ambient-expression-types";

export interface FieldCell {
  /** Cell centre in CSS px. Set by Field Engine, refined by Natural
   *  Distribution. Permanent once Natural Distribution finishes -- no later
   *  engine ever moves a glyph (Sprint 03C's own absolute rule). */
  x: number;
  y: number;
  /** Grid coordinates, used by the diagonal wave phase. Set by Field Engine,
   *  never changed afterward. */
  col: number;
  row: number;
  /** Set by Field Engine. */
  stratum: FieldStratum;
  /** Set by Civilization Engine (dealGlyphForStratum, field-layout.ts). */
  glyph: Glyph;
  /** Optical Weight Calibration: which registered glyph set (glyphs.ts)
   *  this cell's glyph came from. Set by the SAME Civilization Engine
   *  decision that chose the glyph itself -- not a separate classification
   *  pass, so it can never drift out of sync with what was actually
   *  selected. Used only by renderer.ts's optical calibration step; does
   *  not influence selection, layout, or affinity. */
  scriptId: string;
  /** Invisible spatial metadata, populated by affinity-engine.ts's
   *  applyAffinity() as a pass AFTER buildFieldLayout() returns -- not set
   *  in field-layout.ts. Optional in the type because buildFieldLayout()
   *  itself doesn't produce it; guaranteed present at runtime once the
   *  affinity pass has run (see engine.ts). */
  affinity?: GlyphAffinity;
  /** Minimal behavioural metadata, populated by emergent-harmony.ts's
   *  applyEmergentHarmony() as a pass AFTER affinity runs. Optional for the
   *  same reason `affinity` is; guaranteed present at runtime once the
   *  harmony pass has run (see engine.ts). */
  harmony?: GlyphHarmony;
  /** Ambient Language Layer bridge: set on demand by
   *  ambient-expression.ts's applyAmbientExpression() when a semantic word
   *  request matches this cell's glyph -- NOT set during the normal
   *  layout-build pipeline, and not guaranteed to ever be set at all. Unlike
   *  `affinity`/`harmony` (always present once their pass runs), this field
   *  is absent on almost every cell almost all the time; presence is
   *  event-driven, not layout-build-driven. */
  expression?: GlyphExpression;
}

export interface FieldLayout {
  width: number;
  height: number;
  cells: FieldCell[];
}
