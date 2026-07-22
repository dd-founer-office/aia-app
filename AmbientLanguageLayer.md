# Ambient Language Layer v1.0 (MVP)

## What This Is, and Isn't

Tamil is not decoration and not an animation — it is a participant. The Ambient Language Layer is a lightweight bridge that lets the application occasionally ask the already-existing Living Field to gently express a meaningful Tamil word, through the Living Kernel's own existing visual language. It is not the future Living Language Project, and it introduces no new visual mechanism of its own — everything it triggers is opacity, the one lever every prior sprint has already established as safe.

## Architecture

```
Application Event
        ↓
Ambient Language Layer      (lib/ambient-language/)
        ↓
Living Kernel                (lib/living-field/ — six-stage pipeline, unchanged)
        ↓
Renderer
```

**"Living Kernel" in this diagram is the whole locked six-stage system, treated as one unit** — the Ambient Language Layer calls *into* it through exactly one method (`engine.expressWord(graphemes)`), the same way any external caller might. It is not inserted as a seventh sequential stage between Harmony and the Renderer. That distinction matters and is explained fully below.

### Why this isn't a seventh pipeline stage

Field Engine, Natural Distribution, Civilization Engine, Affinity Engine, and Harmony Engine all run exactly once per layout build — a pure function of viewport size, with no concept of "now" beyond the render loop's per-frame `t`. Word expression is fundamentally different: it's triggered by an external, asynchronous, application-level event at an arbitrary moment, and needs to visibly rise and fall over several real seconds. It cannot be computed once at layout-build time the way the other five stages are. It's implemented instead as a small, on-demand bridge (`lib/living-field/ambient-expression.ts`) that composes with the renderer's existing multiplicative opacity pipeline — the same pattern already used to layer Affinity's breathing phase, Harmony's amplitude scale, and Optical Calibration's per-script weight on top of each other.

### Why the Ambient Language Layer lives outside `lib/living-field/`

It's a peer of the Kernel, not an internal engine — living in its own `lib/ambient-language/` folder makes that a physical fact of the folder structure, not just a documentation claim. It imports exactly two things from the Kernel: `getActiveLivingFieldEngine()` (to reach the one entry point it's allowed to call) and `EXPRESSION_TOTAL_DURATION_MS` (a duration constant, for its own cooldown bookkeeping). Nothing else — no canvas, no glyph positions, no opacity math, no knowledge of Affinity or Harmony.

## Responsibility Split

| Layer | Decides | Never touches |
|---|---|---|
| **Ambient Language Layer** | *Whether* a moment is right (cooldown, overlap, reduced motion) and *what word* participates | Canvas, glyph positions, opacity, breathing, typography, rendering of any kind |
| **Living Kernel** (`ambient-expression.ts`) | *How* — which on-screen cells match, and the exact opacity rise/hold/fall curve | Which application event fired, Tamil vocabulary, cooldown timing |

This mirrors the spec's own framing exactly: *"Please allow the field to gently express this word." The Living Kernel decides HOW.*

## The Mechanism

1. Something in the application calls `notifyEvent(eventName, options?)`.
2. The layer checks, in order: is `prefers-reduced-motion` active (if so, silently do nothing) → is a previous expression's cooldown/overlap window still active (if so, silently do nothing) → does this event have a word (the six MVP events have one hardcoded; `kuralSection` requires the caller to supply `options.phrase`, since this layer must never invent Thirukkural content — the real verse is already sourced elsewhere in the app from the approved FI-DB-003/KKA record).
3. If all clear, the word/phrase is segmented into Tamil grapheme clusters — **using `Intl.Segmenter`, not naive code-point splitting.** This matters concretely: "க்" (consonant + pulli) is a single atomic unit in the 247-glyph set, but naive splitting would break it into two separate code points that don't individually exist as glyphs. Verified computationally against the real glyph set for all six MVP words before writing any implementation.
4. `engine.expressWord(graphemes)` is called. The Kernel scans the *current* on-screen layout for cells whose glyph exactly matches one of the target graphemes, and gives each match a temporary opacity boost: a slow rise (3s) → hold (4s) → slow fall (4s), composed multiplicatively on top of whatever opacity that cell would already have (stratum, wave, breath, intensity, optical calibration, harmony — all completely unaffected).

### Why matching is best-effort, not guaranteed

The field only ever shows a small random subset of the 247 possible letters at any given moment. This mechanism does not force target letters to appear — that would mean reaching into Civilization Engine's selection, which is explicitly forbidden. It only lights up whichever matching letters *already happen* to be present. A word may show all of its letters, some, or none, depending on what the field already contains — **this is the intended behaviour, not a limitation.** It's the literal implementation of "discovered rather than constructed": nothing is assembled on demand: only what's already there is, occasionally, noticed.

Verified on a realistic layout: 7 cells matched for "அறம்" (Home) out of ~1,200 total cells on screen — a real, working result, not merely a theoretical possibility.

## MVP Vocabulary

| Event | Word | Meaning |
|---|---|---|
| `appLaunch` | வணக்கம் | Greetings |
| `homeReady` | அறம் | Aram (Right Action) |
| `treeMission` | மரம் | Tree |
| `education` | கல்வி | Education |
| `food` | பகிர்வு | Sharing |
| `evidencePublished` | வாழ்க | May it flourish |
| `kuralSection` | *(caller-supplied)* | Whatever the day's already-approved Kural is |

Nothing else. No personalization, no AI, no user history, no festivals — exactly as scoped.

## Why Opacity Only, Never Size, Colour, or Movement

Sprint 03C's Absolute Rules forbid moving, rotating, or visibly scaling glyphs, and forbid interfering with Optical Calibration's locked size values. Those rules aren't read here as scoped only to the Harmony Engine — they describe the Kernel's overall visual language, and this task's own instruction ("preserve all existing Living Kernel principles" in spirit, and explicitly here: no canvas manipulation, no glyph position changes, no rendering by this layer) is honored by keeping the one new lever to exactly the one already-established-safe property: opacity. The peak boost (+70%) is deliberately more noticeable than Harmony's ~8% ambient variation — this is meant to be discoverable if you're looking — but it never changes colour, size, or position, and the rise/fall are slow enough that there's no perceptible "start" moment.

## What Was Touched, Precisely

| File | Change |
|---|---|
| `lib/living-field/ambient-expression-types.ts` | **New.** One field: `startTime`. |
| `lib/living-field/ambient-expression.ts` | **New.** Matching + envelope math. |
| `lib/living-field/ambient-expression.selfcheck.ts` | **New.** |
| `lib/living-field/engine-registry.ts` | **New.** Tiny bridge exposing the mounted engine instance. |
| `lib/living-field/field-cell.ts` | One optional field added (`expression?`), following the constitution's own extension rules exactly. |
| `lib/living-field/renderer.ts` | One more multiplicative opacity layer, defaulting to exactly 1 (no change) when absent. |
| `lib/living-field/engine.ts` | One new public method, `expressWord()`. Does not run as part of the five-stage `rebuild()` — called on demand. |
| `lib/ambient-language/*` | **New.** The layer itself, entirely outside the Kernel. |
| `components/field/LivingField.tsx` | Two lines: register the engine on mount, clear it on unmount. |

**Confirmed untouched, by file timestamp:** `field-layout.ts`'s Field/Civilization Engine logic, `natural-distribution.ts`, `affinity-engine.ts`, `emergent-harmony.ts`, `optical-calibration.ts`, `glyphs.ts`, `config.ts`. Every locked system's actual behaviour is exactly as it was.

## Verified, Not Assumed

- Grapheme segmentation confirmed correct for all six MVP words, cross-checked against the actual 247-glyph set (not just the theoretical Unicode clustering rule).
- Envelope math (rise/hold/fall) verified numerically at fixed time points, including monotonicity checks across the full rise and fall.
- Matching logic verified against a real generated layout: exactly the matched cells get tagged, with the correct start time, nothing else.
- Cooldown/overlap gating verified: an immediate second `notifyEvent` call during an active window is correctly rejected.
- `kuralSection`'s "never invent content" rule verified: calling it without a phrase is rejected.
- **Zero regression:** the complete existing self-check suite (Affinity, Natural Distribution, Optical Calibration, Harmony) re-run afterward — all four pass with numbers matching every established baseline exactly.

## What This Task Does Not Include

Actually calling `notifyEvent(...)` from real page components (Home mounting, app launch, a mission type being selected, the Kural card rendering) is application wiring this task didn't include — each call site is a single line (e.g. `useEffect(() => { notifyEvent("homeReady"); }, [])`), but writing it requires freshly verified, current content of each page file, which is a small, separate follow-up rather than something to guess at here.
