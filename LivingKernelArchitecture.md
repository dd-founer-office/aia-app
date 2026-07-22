# Living Kernel Architecture

**Status: LOCKED — v1.0**
This document is the permanent constitution of the Living Kernel. Any future engine, or any change to an existing one, must be checked against this document before being written.

---

## 1. The Pipeline

```
Field Engine
    ↓
Natural Distribution Engine
    ↓
Civilization Engine
    ↓
Affinity Engine
    ↓
Harmony Engine
    ↓
Renderer
```

Six stages. Each runs once per layout build (on mount, and on viewport resize) — never per animation frame, with the sole exception of the Renderer, which runs every frame by definition (it's what puts pixels on screen). Data flows strictly downward through this list. No stage ever calls back upward.

## 2. Engine Responsibilities

| Engine | Owns | File | Writes to `FieldCell` |
|---|---|---|---|
| **Field Engine** | Which grid cells are occupied (clustered-scatter, gaps), each cell's base position, each cell's depth stratum | `field-layout.ts` (`generateFieldSlots`) | `x, y, col, row, stratum` |
| **Natural Distribution** | The *exact* pixel position of each cell, refined from Field Engine's base grid position | `natural-distribution.ts` | `x, y` (refines, doesn't add fields) |
| **Civilization Engine** | Which script a cell's glyph comes from, and which specific glyph (via per-script no-repeat dealers) | `field-layout.ts` (`dealGlyphForStratum`, `buildDealers`) | `glyph, scriptId` |
| **Affinity Engine** | Neighborhoods, local density, affinity strength, breathing phase offset — invisible spatial metadata | `affinity-engine.ts` | `affinity` |
| **Harmony Engine** | How deep each cell's existing breathing dips, derived from Affinity's own metadata | `emergent-harmony.ts` | `harmony` |
| **Renderer** | Painting a frame from whatever it's handed, every animation frame | `renderer.ts` | *(reads only, writes nothing)* |

**Field Engine and Civilization Engine share one file** (`field-layout.ts`) for historical reasons (Sprint 03B's restructuring split one fused loop into these two stages without renaming the file). This is documented here explicitly so it is never a surprise: they remain two distinct responsibilities within that file, not one merged concern.

The shared `FieldCell`/`FieldLayout` types live in `field-cell.ts` — a neutral file owned by no single engine. This is where a future engine's new metadata field gets added, not wherever the base type happens to already be defined.

## 3. Data Flow Rule

**Data flows in one direction only.** An engine may read any field written by an engine *before* it in the pipeline. An engine may never read a field only a *later* engine writes, and may never import logic from a later engine.

Concretely:
- Field Engine and Civilization Engine (`field-layout.ts`) have **zero knowledge** of Affinity or Harmony — verified by import audit: neither file imports anything from `affinity-engine.ts`, `affinity-types.ts`, `emergent-harmony.ts`, or `harmony-types.ts`. Their only type-level connection to those stages is that `field-cell.ts` (the neutral shared contract, not either engine's own file) declares the optional fields those later stages will populate.
- Natural Distribution knows nothing beyond `config.ts` (for `FieldStratum`) — it doesn't even know `FieldCell` exists; it operates purely on `FieldSlot`, a smaller, Field-Engine-only intermediate type.
- Affinity Engine and Harmony Engine each import only the shared `FieldCell` type and their own metadata type — nothing from each other's internals, nothing from anything upstream of Affinity.
- The Renderer, as the final consumer, is the one stage permitted to know about everything upstream (it reads `stratum`, `glyph`, `scriptId`, `affinity`, `harmony`, and the full `config`) — because painting a frame legitimately requires all of it.
- `engine.ts` (the orchestrator, not one of the six pipeline stages) is the only file permitted to import every stage — that's its job: calling each one in the correct order once per layout build.

## 4. Renderer Boundary

**Only the Renderer renders.** Verified: no file other than `renderer.ts` touches a canvas context, the DOM, or `window`.

**The Renderer never decides behavior — it evaluates already-decided parameters.** This distinction matters and is written down here precisely because it's easy to misread the wave/breath math living in `renderer.ts` as "the renderer calculating behaviour":

- Affinity decides *what phase offset* a cell breathes at. Harmony decides *how deep* it breathes. Both are metadata, computed once per layout build, before any frame is painted.
- The Renderer's `breathMultiplier()` function evaluates a sine wave using those already-decided numbers at a specific instant, `t`. That's arithmetic on a timestamp — a rendering-time operation by necessity, since "what time is it right now" is meaningless to a stage that only runs once per layout build.
- The Renderer never chooses a phase, an amplitude, a neighborhood, a script, or a position. It only ever multiplies numbers it was handed.

If a future engine wants to introduce a new per-frame visual property, the decision of *what that property's value should be* belongs in a new engine stage (or an existing one), producing metadata — never as new logic written directly inside `renderer.ts`.

## 5. No Duplicated Responsibility

If metadata already exists, reuse it — don't recompute it. Confirmed:
- Harmony Engine derives its one value directly from Affinity's `localDensity` and `affinityStrength` — it does not re-run any spatial density calculation of its own.
- Natural Distribution and Affinity Engine each contain a small, independent hash-utility function (`latticeHash` / `hash01`). **This is an intentional exception, not an oversight:** Sprint 03B was explicitly instructed not to modify the Affinity Engine, even to add a shared import, so the tiny primitive was duplicated rather than coupling the two files together across a sprint boundary. This is not a violation of "don't duplicate responsibility" — the two functions serve different purposes (one seeds position noise, the other seeds a breathing phase) and are generic math primitives, not shared domain metadata. A future consolidation into a shared `hash.ts` utility would be reasonable but is not required, and should only be done in a sprint that explicitly permits touching both files.

## 6. Metadata, Not Global State

Every engine's output is a field on `FieldCell` — verified: no engine holds hidden mutable module-level state (the only module-level state anywhere in the kernel is read-only configuration and the intentionally-scoped internal counters inside each glyph dealer closure, which are per-dealer, not shared or global). Cross-module mutation of another engine's internals does not occur anywhere in the pipeline.

## 7. Extension Rules

Adding a seventh engine to this pipeline:

1. Decide where in the sequence it runs. It may only consume metadata from stages before its position, never from stages after it.
2. Give it its own file, its own single responsibility, and its own metadata type file (mirroring `affinity-types.ts` / `harmony-types.ts`).
3. Add its one new optional field to `FieldCell` in `field-cell.ts` — not inside whichever engine's file the type used to live in.
4. If the Renderer needs to consume its output, thread it through as one more optional parameter on an existing rendering function (mirroring `phaseOffset` and `amplitudeScale` on `breathMultiplier`), defaulting to a no-op value so every prior behavior remains bit-identical when the new metadata is absent.
5. Wire it into `engine.ts`'s `rebuild()` in the correct position, after whatever it depends on.
6. Write a self-check script verifying: every cell gets valid, bounded metadata; determinism where applicable; no regression in the existing self-check suite; performance stays sub-linear.

## 8. Prohibited Patterns

- An engine importing another engine's *logic* (functions, classes) from a stage that comes after it in the pipeline.
- An engine performing canvas/DOM operations.
- The Renderer containing an `if` statement that decides *what* a cell's behavior should be, rather than *how* to paint an already-decided value.
- Recomputing metadata that an earlier engine already produced.
- Storing engine output anywhere other than as a field on `FieldCell`.
- A new engine's optional `FieldCell` field being declared inside an unrelated engine's own file rather than in `field-cell.ts`.

## 9. Design Philosophy

Each engine should be independently readable in isolation: given only `FieldCell`'s documented shape and one engine's own file, a future developer should be able to fully understand what that engine does without reading any other engine's implementation. The type contract (`field-cell.ts`) is the seam between engines — it is the only thing every engine agrees on, and the only thing that should ever need to grow as the kernel grows.

---

*This document was produced as part of the Living Kernel v1.0 Final Architecture Lock. One code change was made to bring the implementation fully into line with the principles above (extracting `FieldCell`/`FieldLayout` to a neutral `field-cell.ts`); it is a type-only change, verified to produce zero behavioral difference via a full rerun of every existing self-check. No visual, behavioral, animation, or performance change was made anywhere in this pass.*
