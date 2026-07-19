import type { CQIStatus } from "@/types/mission-camera";

const STATUS_COLOR: Record<CQIStatus, string> = {
  ready: "var(--color-success)",
  "needs-improvement": "var(--color-pending)",
  "not-ready": "var(--color-error)",
};

interface CaptureQualityIndicatorProps {
  status: CQIStatus;
}

/** Corner accents only — preview stays unobstructed, no thick borders. */
export function CaptureQualityIndicator({ status }: CaptureQualityIndicatorProps) {
  const color = STATUS_COLOR[status];
  const corner = "absolute h-6 w-6";

  return (
    <div className="pointer-events-none absolute inset-4">
      <span className={`${corner} left-0 top-0 rounded-tl-md border-l-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${corner} right-0 top-0 rounded-tr-md border-r-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-md border-b-2 border-l-2`} style={{ borderColor: color }} />
      <span className={`${corner} bottom-0 right-0 rounded-br-md border-b-2 border-r-2`} style={{ borderColor: color }} />
    </div>
  );
}
