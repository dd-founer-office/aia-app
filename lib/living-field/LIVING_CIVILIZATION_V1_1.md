# Living Civilization v1.1 — Locked
**Merge Report**
Compiled July 22, 2026

---

## Decision

Founder completed live review of Optical Calibration Versions A, B, and C on the deployed site. **Version C was selected as the permanent calibration.** This is now **Living Civilization v1.1**, locked.

## What Was Removed

- `CALIBRATION_A`, `CALIBRATION_B`, `CALIBRATION_C` — the three evaluation presets no longer exist as separate objects.
- `ALL_CALIBRATIONS` — the array used to look up a preset by id.
- `resolveActiveCalibration()` and all `process.env.NEXT_PUBLIC_OPTICAL_CALIBRATION` reading — the environment-variable switching mechanism used only for founder review is gone. There is no runtime branching between calibrations left anywhere in the codebase.
- `optical-calibration.selfcheck.ts`'s preset-isolation tests (verifying A/B/C changed only what each was supposed to) — meaningless once only one profile exists, so removed along with the presets they tested.

**Confirmed by file timestamp, not by claim:** `renderer.ts`, `field-layout.ts`, `engine.ts`, `affinity-engine.ts`, and `natural-distribution.ts` were not touched by this task at all — they still carry their pre-lock modification times.

## What Remains

- `optical-calibration.ts` still exports exactly the same five names `renderer.ts` imports — `ACTIVE_CALIBRATION`, `SCRIPT_IDS`, `getScriptWeight`, `applyOpticalOpacity`, `applyOpticalSize` — with identical signatures. **`renderer.ts` required zero edits to lock this in**, confirmed by both file timestamp and a full typecheck pass.
- `ACTIVE_CALIBRATION` now always equals the single new constant `LIVING_CIVILIZATION_V1_1` — no configuration, no environment variable, no lookup by id.
- The `OpticalCalibration`/`ScriptOpticalWeight` type shapes are unchanged, so a future re-calibration (should one ever be needed) has the same clean structure to extend from — just define a new profile object and point `ACTIVE_CALIBRATION` at it.
- `optical-calibration.selfcheck.ts` still exists, rewritten to verify the single locked profile's exact values (Modern Tamil unchanged; Tamil-Brahmi and Vatteluttu both +12.5% opacity/size; Tamil-Brahmi additionally at font-weight 500) plus full-pipeline and performance regression checks — it's now a permanent regression guard, not an evaluation tool.

## Verified, Not Assumed

Ran the actual compiled code after the rewrite: `ACTIVE_CALIBRATION === LIVING_CIVILIZATION_V1_1` confirmed; all three locked per-script values confirmed exact; opacity/size math confirmed correct against the locked numbers; full layout pipeline still produces valid `scriptId`-tagged cells; performance still sub-linear (5.6x time for 15.3x cells), no regression from removing the preset-selection indirection.

## The Locked Values (Living Civilization v1.1)

| Script | Opacity | Size | Font Weight |
|---|---|---|---|
| Modern Tamil | ×1 (unchanged) | ×1 (unchanged) | base (400) |
| Tamil-Brahmi | ×1.125 | ×1.125 | 500 |
| Vatteluttu | ×1.125 | ×1.125 | — (path glyph, no weight concept) |

## Scope Discipline

No feature work, no behavioral changes beyond using the locked profile, no new visual effects — nothing in `renderer.ts`'s actual drawing behavior changed as part of this lock; it was already applying whatever `ACTIVE_CALIBRATION` pointed to, and now that constant simply always points to the same thing.

## Commit

One file changed, one file's tests updated to match:
1. `lib/living-field/optical-calibration.ts`
2. `lib/living-field/optical-calibration.selfcheck.ts`

Once committed, the environment variable `NEXT_PUBLIC_OPTICAL_CALIBRATION` in Vercel's project settings is no longer read by any code — it can be safely deleted from the project's environment configuration (optional cleanup, not required for correctness, since unused env vars are simply ignored).
