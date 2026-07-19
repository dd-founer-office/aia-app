import { MapPin } from "lucide-react";
import { colors } from "../../tokens/colors";
import { radius } from "../../tokens/radius";
import { Card } from "../Card/Card";

export interface EvidenceCardProps {
  heroImage: string;
  supportingImageCount?: number;
  category: string;
  placeName: string;
  completedDate: string;
  headline: string;
  supportingCopy?: string;
  isSharedAct?: boolean;
  contributorCount?: number;
  /**
   * Deliberate change from the source (which hardcoded next/link to
   * /acts/[actId]). This package has no router — caller supplies both
   * the href (for a plain <a>, if used inside Next.js) and/or an
   * onClick, so it works in Emergent or any other host app.
   */
  href?: string;
  onClick?: () => void;
  linkLabel?: string;
}

/**
 * Ported from aia-app/components/shared/EvidenceCard.tsx (COMP-004 Evidence
 * Card, canonical). Trust badges deliberately do not render here — that
 * lives on CA-011's Verification Summary, matching the app exactly.
 */
export function EvidenceCard({
  heroImage,
  supportingImageCount = 0,
  category,
  placeName,
  completedDate,
  headline,
  supportingCopy,
  isSharedAct = false,
  contributorCount,
  href,
  onClick,
  linkLabel,
}: EvidenceCardProps) {
  const Wrapper = href ? "a" : "div";

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {isSharedAct && (
        <span
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "9999px",
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: 500,
            backgroundColor: colors.badgeVerifiedBg,
            color: colors.primaryDark,
          }}
        >
          Shared Act of Aram
        </span>
      )}

      <Wrapper
        href={href}
        onClick={onClick}
        style={{ position: "relative", display: "block", cursor: href || onClick ? "pointer" : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={headline}
          style={{ height: "260px", width: "100%", borderRadius: radius.photo, objectFit: "cover" }}
        />

        {supportingImageCount > 0 && (
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "12px",
              display: "flex",
              height: "28px",
              minWidth: "28px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              padding: "0 6px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#FFFFFF",
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            +{supportingImageCount}
          </span>
        )}

        <span
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "9999px",
            padding: "6px 12px",
            fontSize: "12px",
            color: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          <MapPin size={12} />
          {placeName}
          <span style={{ opacity: 0.7 }}>·</span>
          {completedDate}
        </span>
      </Wrapper>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: colors.primaryDark,
          }}
        >
          {category}
        </p>
        <p style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1.3 }}>{headline}</p>
        {supportingCopy && (
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: colors.mutedForeground }}>
            {supportingCopy}
          </p>
        )}
        {isSharedAct && contributorCount ? (
          <p style={{ fontSize: "14px", color: colors.mutedForeground }}>
            {contributorCount} contributors participated together
          </p>
        ) : null}
      </div>

      {(href || onClick) && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          
            href={href}
            onClick={onClick}
            style={{ fontSize: "14px", fontWeight: 500, color: colors.primaryDark, cursor: "pointer" }}
          >
            {linkLabel ?? (isSharedAct ? "View Shared Act →" : "View Act →")}
          </a>
        </div>
      )}
    </Card>
  );
}
