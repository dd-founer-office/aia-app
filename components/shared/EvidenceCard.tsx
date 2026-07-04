import { ShieldCheck, CheckCircle2, Camera, Users } from "lucide-react";
import { PhotoGallery } from "@/components/shared/PhotoGallery";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";

export interface EvidenceCardProps {
  heroImage: string;
  supportingImages?: string[];
  cause: string;
  location: string;
  impactSummary: string;
  completedDate: string;
  isSharedAct?: boolean;
  contributorCount?: number;
  onView?: () => void;
}

/**
 * COMP-004 -- Evidence Card (canonical).
 * Per the Product Component Library update (locked): this is the single
 * card used everywhere an Act of Aram is shown -- CA-009 Home, CA-010 Acts
 * Feed, CA-011 Act Detail, CA-012 Journey, CA-013 Profile. No alternate
 * card design, no campaign/promotional variant ("Act Card Consistency,
 * Locked" -- CA-010).
 *
 * Trust before excitement, meaning before metrics: story/outcome first,
 * Verified/Executed/Documented indicators are subtle, and the CTA is a
 * text link ("View Act →" / "View Shared Act →"), never a filled button,
 * per CA-010: "Use a subtle text CTA. Do not use filled buttons."
 *
 * Verified/Executed/Documented render with their own distinct Lucide
 * icons here rather than through the shared Badge primitive (COMP-009):
 * Badge represents one-of-many dynamic states with a single icon per
 * status, but these three are fixed, always-co-present facts about an
 * Act, each with its own meaning (shield / check / camera), matching the
 * approved CA-010 mockup. Kept subtle per CA-010: "These should remain
 * subtle. Evidence should come primarily from the photography."
 *
 * Shared Act variant (COMP-005 rules, locked): shows only a "Shared Act
 * of Aram" icon chip and a contributor count. Never contributor names,
 * amounts, or rankings.
 *
 * Cause and district render as plain text, not a colored badge -- Visual
 * Constitution §3/§8: "Colours communicate STATE, not CATEGORY" /
 * "Colours represent status, never cause."
 */
export function EvidenceCard({
  heroImage,
  supportingImages = [],
  cause,
  location,
  impactSummary,
  completedDate,
  isSharedAct = false,
  contributorCount,
  onView,
}: EvidenceCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      {isSharedAct && (
        <span
          className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-badge-verified-bg)",
            color: "var(--color-primary-dark)",
          }}
        >
          <Users size={13} />
          Shared Act of Aram
        </span>
      )}

      <PhotoGallery
        images={[heroImage, ...supportingImages]}
        altPrefix={`${cause} Act of Aram`}
      />

      <div className="flex flex-col gap-1">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {cause} · {location}
        </p>
        <p className="text-lg font-semibold leading-snug">{impactSummary}</p>
        {isSharedAct && contributorCount ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {contributorCount} contributors participated together
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4">
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: "var(--color-primary-dark)" }}
        >
          <ShieldCheck size={14} />
          Verified
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: "var(--color-primary-dark)" }}
        >
          <CheckCircle2 size={14} />
          Executed
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: "var(--color-primary-dark)" }}
        >
          <Camera size={14} />
          Documented
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">{completedDate}</p>
        <Button variant="text" onClick={onView}>
          {isSharedAct ? "View Shared Act →" : "View Act →"}
        </Button>
      </div>
    </Card>
  );
}
