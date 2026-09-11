/**
 * Daily Aathichoodi Series — Parent Hook Selection (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * "Have you taught your child this?" is not a design element -- it's the
 * series' psychological entry point for parents. Per explicit founder
 * direction, it MUST appear on every Aathichoodi post; a different hook is
 * used only when an editor has decided a specific episode has a genuinely
 * strong strategic reason to depart from it (canon.ts's per-episode
 * `curated.hookOverride`, a deliberate hand-authored exception, never an
 * automatic rotation). There is no theme-based pool selection here anymore
 * -- the fixed hook is the point.
 */

export const PRIMARY_HOOK = "Have you taught your child this?";

export function selectHook(hookOverride: string | undefined): string {
  return hookOverride ?? PRIMARY_HOOK;
}
