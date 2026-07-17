interface ProgressIndicatorProps {
  current: number;
  /** Must reflect only steps that actually render for this contributor, not the theoretical maximum. */
  total: number;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <p className="text-xs text-[var(--color-muted-foreground)]" aria-hidden="true">
      Step {current} of {total}
    </p>
  );
}
