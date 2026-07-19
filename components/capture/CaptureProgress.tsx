interface CaptureProgressProps {
  completed: number;
  total: number;
}

export function CaptureProgress({ completed, total }: CaptureProgressProps) {
  return (
    <p className="text-xs text-[var(--color-muted-foreground)]">
      {completed} / {total} Completed
    </p>
  );
}
