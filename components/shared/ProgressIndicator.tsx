interface ProgressIndicatorProps {
  /** The current step, 1-indexed. */
  current: number;
  /**
   * Total steps that will actually render for this contributor.
   * NOTE: this must reflect only visible steps — e.g. at MVP, with
   * Choose Participation Method auto-skipped because only one method is
   * enabled, `total` should be 4, not the full 6-step architectural
   * skeleton. Counting hidden steps reads as wrong to the contributor
   * (see CA-014A UX spec §10 self-review).
   */
  total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <p
      className="text-[13px] text-(--color-text-muted) font-sans"
      aria-hidden="true"
    >
      Step {current} of {total}
    </p>
  );
}
