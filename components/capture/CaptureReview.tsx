import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { CQIReading } from "@/types/mission-camera";

interface CaptureReviewProps {
  previewUrl: string;
  kind: "photo" | "video";
  cqi: CQIReading;
  onRetake: () => void;
  onAccept: () => void;
}

const STATUS_LABEL: Record<CQIReading["status"], string> = {
  ready: "Evidence meets capture standards.",
  "needs-improvement": "Acceptable, but could be improved.",
  "not-ready": "Required evidence or metadata is missing.",
};

/** "Evidence progresses only after validation" — accept is disabled when not-ready. */
export function CaptureReview({ previewUrl, kind, cqi, onRetake, onAccept }: CaptureReviewProps) {
  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <div className="relative flex-1">
        {kind === "video" ? (
          <video src={previewUrl} controls playsInline className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Captured evidence preview" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="rounded-t-[var(--radius-card)] bg-[var(--color-card)] px-5 pb-6 pt-4">
        <p className="mb-4 text-sm text-[var(--color-foreground)]">{STATUS_LABEL[cqi.status]}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onRetake}>
            <span className="flex items-center justify-center gap-1.5">
              <RotateCcw size={16} /> Retake
            </span>
          </Button>
          <Button variant="primary" className="flex-1" onClick={onAccept} disabled={cqi.status === "not-ready"}>
            <span className="flex items-center justify-center gap-1.5">
              <Check size={16} /> Use This
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
