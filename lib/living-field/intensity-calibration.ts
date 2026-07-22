/**
 * Living Field — Intensity Calibration (TEMPORARY, for founder review)
 * ----------------------------------------------------------------------------
 * Living Field Foundation Completion v1.0, Part 2.
 *
 * `intensity` has been at 3.5 since Sprint 01 -- a deliberately loud value
 * chosen only so the field was visible enough during development review,
 * never a final creative decision. This is that final calibration.
 *
 * Same mechanism as Optical Calibration's evaluation phase: three candidate
 * values, switchable via an environment variable, so all three can be
 * reviewed live on the deployed site without a code change between them.
 *
 * THIS FILE IS TEMPORARY. Per the task's explicit instruction ("Do not
 * permanently introduce runtime configuration"), once the founder selects
 * one candidate, this module should be deleted and `config.ts`'s
 * `intensity` field should go back to being a single hardcoded literal --
 * exactly the value chosen, with no env var, no branching, no leftover
 * indirection. That follow-up mirrors exactly how optical-calibration.ts
 * was reduced from three presets down to one locked profile.
 *
 * Only `intensity`'s SOURCE changes here (hardcoded literal -> env-resolved
 * variable). The opacity FORMULA that consumes it
 * (renderer.ts's cellOpacity/cellOpacityStatic, still
 * `... * config.intensity`) is completely untouched -- breathing, wave,
 * Civilization, Natural Distribution, Affinity, and Optical Calibration are
 * not read, imported, or affected by this file in any way.
 */

export interface IntensityCandidate {
  id: "A" | "B" | "C";
  value: number;
  label: string;
}

export const INTENSITY_A: IntensityCandidate = {
  id: "A",
  value: 2.8,
  label: "Candidate A (2.8)",
};

export const INTENSITY_B: IntensityCandidate = {
  id: "B",
  value: 2.5,
  label: "Candidate B (2.5)",
};

export const INTENSITY_C: IntensityCandidate = {
  id: "C",
  value: 2.2,
  label: "Candidate C (2.2)",
};

export const ALL_INTENSITY_CANDIDATES: readonly IntensityCandidate[] = [
  INTENSITY_A,
  INTENSITY_B,
  INTENSITY_C,
];

/**
 * Resolved from NEXT_PUBLIC_INTENSITY_CANDIDATE ("A" | "B" | "C"). Defaults
 * to Candidate A (2.8, the highest/most-visible of the three) if unset or
 * invalid, so the field never accidentally goes darker than intended by a
 * missing environment variable.
 */
function resolveActiveIntensityCandidate(): IntensityCandidate {
  const requested = process.env.NEXT_PUBLIC_INTENSITY_CANDIDATE;
  const found = ALL_INTENSITY_CANDIDATES.find((c) => c.id === requested);
  return found ?? INTENSITY_A;
}

/** The single number config.ts reads. Swap the env var and redeploy to
 *  review a different candidate; nothing else needs to change. */
export const ACTIVE_INTENSITY: number = resolveActiveIntensityCandidate().value;
