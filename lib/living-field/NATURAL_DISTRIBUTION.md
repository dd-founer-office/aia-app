# Living Field — Kernel Pipeline (as of Sprint 03B)

Developer documentation for the Natural Distribution Engine and its place in
the Living Kernel. Written for whoever next touches this code — including a
future version of whoever wrote it.

## The Kernel, end to end

```
Living Kernel

├── Field Engine              (field-layout.ts: generateFieldSlots)
├── Natural Distribution      (natural-distribution.ts: applyNaturalDistribution)
├── Civilization Engine       (field-layout.ts: dealGlyphForStratum/buildDealers)
├── Affinity Engine           (affinity-engine.ts: applyAffinity)
└── Renderer                  (renderer.ts: renderField)
```

Field, Natural Distribution, and Civilization all run inside
`buildFieldLayout()` (`field-layout.ts`), as three explicit, sequential
stages. Affinity runs separately, from `engine.ts`'s `rebuild()`, immediately
after `buildFieldLayout()` returns. Renderer runs every animation frame,
downstream of all of the above.

## Who owns what

| Engine | Owns | Never touches |
|---|---|---|
| Field Engine | Which grid cells are occupied (clustered-scatter, gaps), each slot's base position, each slot's depth stratum | Scripts, glyphs, affinity, rendering |
| Natural Distribution | The *exact* pixel position of each slot, refined from the Field Engine's base grid position | Which slots exist, which stratum a slot has, scripts, glyphs, affinity, rendering |
| Civilization Engine | Which script a slot's glyph comes from, and which specific glyph (via per-script no-repeat dealers) | Positions, affinity, rendering |
| Affinity Engine | Neighborhoods, local density, affinity strength, breathing offset — all invisible metadata | Positions, scripts, rendering |
| Renderer | Painting a frame from whatever it's handed | Everything upstream — it has no opinion on any of the above |

If you're adding a feature and you're not sure which file it belongs in: ask
which row of that table it changes. If it changes more than one row, it
probably belongs in more than one commit.

## Why the pipeline is split this way (Sprint 03B rationale)

Before Sprint 03B, `buildFieldLayout()` was one fused loop: for every grid
cell it decided in the same breath whether the cell was occupied, where it
sat, which stratum it belonged to, *and* which glyph it got. That was fine
until the Natural Distribution spec explicitly required refining position
**before** Civilization assigns a script — which isn't expressible if
position and script are decided in the same statement.

The fix was mechanical, not creative: split the one loop into
`generateFieldSlots()` (positions + stratum only) followed by
`applyNaturalDistribution()` (mutates position only) followed by a `.map()`
that calls the *exact same* `dealGlyphForStratum()`/`buildDealers()`
functions Sprint 02 already had. No selection logic changed — only when it
runs, relative to position refinement.

## Natural Distribution: what it actually does

Every slot from the Field Engine sits dead-center in a 60×40px grid cell.
That's mechanically regular at close inspection, even though the *macro*
pattern (which cells are occupied, in loose bursts with gaps) already looks
organic. Natural Distribution nudges each slot's exact (x, y) by a small
amount, breaking that dead-center alignment, without changing which cells
are occupied or what stratum/script they end up with.

The nudge comes from 2D value noise (`valueNoise2D` in
`natural-distribution.ts`) rather than independent per-cell
`Math.random()`, because independent jitter is itself a kind of
mechanical-feeling randomness — it can't produce the gradual, spatially
coherent drift that "soft density variation, never sharp transitions" is
asking for. Value noise samples a smooth deterministic field at each slot's
grid coordinate; nearby slots get similar nudges, distant slots don't.

Two tuning constants, both currently hand-set (not yet in `config.ts`):

- `JITTER_FRACTION` (0.35) — max nudge as a fraction of cell size. Larger
  values break grid alignment more aggressively but risk overlap.
- `NOISE_FREQUENCY` (0.08) — how fast the nudge direction changes across the
  grid. Lower = broader, smoother drift.

If the deployed field needs retuning after visual review, these two
constants are the first place to look — same pattern as
`affinity-engine.ts`'s internal constants.

## What Sprint 03B deliberately did not touch

- `affinity-engine.ts`, `affinity-types.ts` — zero edits. Confirmed by file
  timestamp before this sprint's changes were made.
- `renderer.ts` — zero edits. It already reads `cell.x`/`cell.y` generically
  and has no idea any of this exists.
- The Civilization Engine's actual selection logic
  (`dealGlyphForStratum`, `buildDealers`, `weightedPick`,
  `DEFAULT_SCRIPT_WEIGHTS`) — byte-identical to Sprint 02, just invoked as
  an explicit later stage instead of inline in the scatter loop.
- The clustered-scatter macro pattern itself (gap sizes, burst lengths) —
  unchanged. Sprint 03B is about *exact pixel placement*, not about
  redesigning which regions of the field are populated.

## Verifying a future change to this pipeline

`natural-distribution.selfcheck.ts` is the regression check: run it after
any change to `field-layout.ts` or `natural-distribution.ts` and confirm it
still passes, especially the civilization-mix and affinity-neighborhood
numbers — those are the ones most likely to silently drift if a future edit
accidentally couples two stages that are supposed to stay independent.
