import { PhotoGallery } from "@/components/shared/PhotoGallery";
import { Badge } from "@/components/shared/Badge";
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
 * Verified/Executed/Documented badges are subtle, and the CTA is a text
 * link ("View Act →" / "View Shared Act →"), never a filled button, per
 * CA-010: "Use a subtle text CTA. Do not use filled buttons."
 *
 * Shared Act variant (COMP-005 rules, locked): shows only a "Shared Act
 * of Aram" label and a contributor count. Never contributor names,
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
        <p className="text-xs font-medium text-[var(--color-primary-dark)]">
          Shared Act of Aram
        </p>
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

      <div className="flex flex-wrap gap-2">
        <Badge status="verified" label="Verified" />
        <Badge status="verified" label="Executed" />
        <Badge status="verified" label="Documented" />
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
