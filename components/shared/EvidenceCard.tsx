import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/shared/Card";

export interface EvidenceCardProps {
  actId: string;
  heroImage: string;
  supportingImageCount?: number;
  category: string;
  placeName: string;
  completedDate: string;
  headline: string;
  supportingCopy?: string;
  isSharedAct?: boolean;
  contributorCount?: number;
}

/**
 * COMP-004 -- Evidence Card (canonical), refined per "AiA Acts Feed --
 * Final UI Refinement" direction.
 *
 * The hero photo carries the story; everything else quietly supports it.
 * Trust (Verified/Executed/Documented) no longer renders here -- it now
 * lives entirely on CA-011 Act of Aram Detail's locked "Verification
 * Summary" section, which already covers this. Supporting thumbnails are
 * replaced by a photo-count badge; the full evidence gallery lives on
 * CA-011, not inline on the feed. Both the location pill and the hero
 * image link to CA-011 for this act. "View on Map" (Google Maps via
 * stored lat/long) lives on CA-011 -- the feed never shows coordinates.
 *
 * Cause renders as a small uppercase eyebrow, not a colored badge --
 * still Visual Constitution §8 ("colours represent status, never
 * cause"): muted green text, no pill background.
 */
export function EvidenceCard({
  actId,
  heroImage,
  supportingImageCount = 0,
  category,
  placeName,
  completedDate,
  headline,
  supportingCopy,
  isSharedAct = false,
  contributorCount,
}: EvidenceCardProps) {
  return (
    <Card className="flex flex-col gap-5">
      {isSharedAct && (
        <span
          className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-badge-verified-bg)",
            color: "var(--color-primary-dark)",
          }}
        >
          Shared Act of Aram
        </span>
      )}

      <Link href={`/acts/${actId}`} className="relative block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={headline}
          className="h-[260px] w-full rounded-[var(--radius-photo)] object-cover"
        />

        {supportingImageCount > 0 && (
          <span
            className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            +{supportingImageCount}
          </span>
        )}

        <span
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <MapPin size={12} />
          {placeName}
          <span className="opacity-70">·</span>
          {completedDate}
        </span>
      </Link>

      <div className="flex flex-col gap-2.5">
        <p
          className="text-xs font-medium uppercase"
          style={{ color: "var(--color-primary-dark)", letterSpacing: "0.06em" }}
        >
          {category}
        </p>
        <p className="text-lg font-semibold leading-snug">{headline}</p>
        {supportingCopy && (
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {supportingCopy}
          </p>
        )}
        {isSharedAct && contributorCount ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {contributorCount} contributors participated together
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/acts/${actId}`}
          className="text-sm font-medium"
          style={{ color: "var(--color-primary-dark)" }}
        >
          {isSharedAct ? "View Shared Act →" : "View Act →"}
        </Link>
      </div>
    </Card>
  );
}
