import Link from "next/link";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Calendar, MapPin, ChevronDown, User } from "lucide-react";
import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const TEAL = "#0A363A";
// Existing --color-primary (globals.css) -- the icon/accent color on the
// reference's own white cards, reused here rather than a one-off green.
const PRIMARY = "#328D63";
// Existing --color-badge-verified-bg (globals.css) -- the pale mint icon
// badge behind the reference's own step icons.
const ICON_BADGE_BG = "#E6F2EC";
// AiA's bright mint accent (ActDetailHero/ActSnapshot/ActTheAct), used
// here at very low opacity for the section's soft atmospheric glow.
const MINT = "#68FFAD";

function MomentArrow() {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: TEAL }}>
        <ChevronDown size={18} color="#FFFFFF" />
      </div>
    </div>
  );
}

function RecordIconBadge({ icon }: { icon: ReactNode }) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
      style={{ background: ICON_BADGE_BG }}
    >
      {icon}
    </div>
  );
}

/**
 * One editorial record, styled after the Abyssale reference's own
 * "When this happens / Do this action" cards: a rounded-square icon
 * badge beside a quiet muted-gray label, with the record's real value
 * carried in bold dark text underneath -- not the small green-caps
 * eyebrow treatment used elsewhere on this page.
 */
function EvidenceRecord({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-4 rounded-[20px] border p-5 text-left"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-card)",
        boxShadow: "0 12px 32px rgba(10, 54, 58, 0.06)",
      }}
    >
      <RecordIconBadge icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className={`${inter.className} uppercase`} style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.6px", color: "var(--color-muted-foreground)" }}>
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

function SidePhoto({ src, href }: { src: string; href: string }) {
  return (
    <Link
      href={href}
      aria-label="View this photograph in the full Evidence Viewer"
      className="overflow-hidden rounded-[6px]"
      style={{
        aspectRatio: "1 / 1",
        flex: "0 1 31%",
        boxShadow: "0 6px 16px rgba(10, 54, 58, 0.08)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </Link>
  );
}

/**
 * Three real photographs, asymmetric -- the center one (the featured
 * evidence moment) ~10% larger than the other two, hanging LOWER than
 * them (top-aligned row; the taller center simply extends further down)
 * with a slightly stronger soft shadow; the side photographs are
 * smaller, sit higher/quieter, with a lighter shadow of their own.
 * Matches the Abyssale reference's own layered three-photo composition
 * rather than three equal gallery cards.
 */
function EvidencePhotoRow({ photos, href }: { photos: string[]; href: string }) {
  if (photos.length === 0) return null;

  const [center, left, right] = photos;

  return (
    <div className="flex items-start justify-center gap-2.5">
      {left && <SidePhoto src={left} href={href} />}

      <Link
        href={href}
        aria-label="View this photograph in the full Evidence Viewer"
        className="relative z-10 overflow-hidden rounded-[6px]"
        style={{
          aspectRatio: "1 / 1",
          flex: "0 1 34%",
          boxShadow: "0 16px 32px rgba(10, 54, 58, 0.14)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={center} alt="" className="h-full w-full object-cover" />
      </Link>

      {right && <SidePhoto src={right} href={href} />}
    </div>
  );
}

/**
 * Act Detail's "The Evidence" section -- CA-011's documentary record.
 * Full-bleed surface (-mx-5, like ActTestimonial's own full-bleed
 * section) in the app's established very-light mint page background
 * (--color-background), with a single soft radial mint glow behind the
 * whole composition rather than a visible box -- not pure white. A
 * centered heading/description matching ActTestimonial's exact
 * typography (no eyebrow label), three real capture photos in an
 * asymmetric featured composition, then three WHEN/WHERE/WHO records
 * built from the exact same per-photo trace data the full Living Trace
 * Viewer (/acts/[id]/evidence) renders -- never a separate, divergent
 * fetch. Every value here is either real evidence data or omitted
 * entirely; nothing is reconstructed or guessed (see the per-field
 * comments below for what's omitted and why).
 *
 * Picks the chronologically EARLIEST evidence item as the record this
 * section's WHEN/WHERE/WHO describes -- "original capture", not whichever
 * item happens to sort first in the trace viewer's own (most-recent-first)
 * order.
 */
export function ActEvidence({
  actId,
  organization,
  evidence,
}: {
  actId: string;
  organization: string;
  evidence: EvidenceTraceItem[];
}) {
  if (evidence.length === 0) return null;

  const evidenceHref = `/acts/${actId}/evidence`;
  const photos = evidence.slice(0, 3).map((item) => item.photoUrl);

  const earliest = [...evidence].sort((a, b) => a.captureDateIso.localeCompare(b.captureDateIso))[0];

  const hasCoords = earliest.trust.lat != null && earliest.trust.lng != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${earliest.trust.lat},${earliest.trust.lng}`
    : null;

  // "Alangulam, Thanjavur, Tamil Nadu" -> primary "Alangulam", secondary
  // "Thanjavur, Tamil Nadu" -- same comma-split convention ActSnapshot
  // already uses for this same landmark string.
  const landmarkParts = earliest.landmark?.split(",").map((part) => part.trim()).filter(Boolean) ?? [];
  const [landmarkPrimary, ...landmarkRest] = landmarkParts;
  const landmarkSecondary = landmarkRest.join(", ");

  return (
    <section
      className="relative -mx-5 flex flex-col items-center gap-8 overflow-hidden px-5 py-10 text-center"
      style={{ background: "var(--color-background)" }}
    >
      {/* Soft atmospheric glow behind the whole composition -- a single
          diffused radial wash, not a visible box, low enough opacity to
          read as depth rather than decoration. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 0,
          background: `radial-gradient(62% 55% at 50% 32%, ${MINT}29 0%, ${MINT}12 45%, ${MINT}00 72%)`,
        }}
      />

      <div className="relative flex flex-col gap-2.5 px-2" style={{ zIndex: 1 }}>
        <h2
          className={`${calSans.className} m-0 text-[26px] font-bold leading-[1.15]`}
          style={{ color: TEAL, letterSpacing: "-0.3px" }}
        >
          Every moment leaves a trace.
        </h2>
        <p
          className={`${inter.className} m-0 mx-auto max-w-[280px] text-[14px] leading-[1.55]`}
          style={{ color: "rgba(10, 54, 58, 0.78)" }}
        >
          The Act was documented as it happened.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-stretch gap-6" style={{ zIndex: 1 }}>
        <EvidencePhotoRow photos={photos} href={evidenceHref} />

        <MomentArrow />

        <EvidenceRecord icon={<Calendar size={20} color={PRIMARY} />} label="When It Happened">
          {earliest.captureDateLong && earliest.captureTimeWithOffset ? (
            <div className="flex flex-col gap-0.5">
              <p className={`${inter.className} m-0 text-[17px] font-bold`} style={{ color: "var(--color-foreground)" }}>
                {earliest.captureDateLong}
              </p>
              <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "var(--color-muted-foreground)" }}>
                {earliest.captureTimeWithOffset}
              </p>
            </div>
          ) : (
            // Genuinely missing on the stored evidence row -- never
            // reconstructed. See lib/published-acts.ts's captureDateLong/
            // captureTimeWithOffset comment.
            <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "var(--color-muted-foreground)" }}>
              Capture time unavailable
            </p>
          )}
        </EvidenceRecord>

        <MomentArrow />

        <EvidenceRecord icon={<MapPin size={20} color={PRIMARY} />} label="Where It Happened">
          <div className="flex flex-col gap-2.5">
            {landmarkPrimary ? (
              <div className="flex flex-col gap-0.5">
                <p className={`${inter.className} m-0 text-[17px] font-bold`} style={{ color: "var(--color-foreground)" }}>
                  {landmarkPrimary}
                </p>
                {landmarkSecondary && (
                  <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "var(--color-muted-foreground)" }}>
                    {landmarkSecondary}
                  </p>
                )}
              </div>
            ) : (
              <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "var(--color-muted-foreground)" }}>
                Location unavailable
              </p>
            )}

            {hasCoords && (
              <p className={`${inter.className} m-0 text-[12.5px] leading-[1.6]`} style={{ color: "var(--color-muted-foreground)" }}>
                Lat {earliest.trust.lat!.toFixed(6)}°
                <br />
                Long {earliest.trust.lng!.toFixed(6)}°
              </p>
            )}

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${inter.className} text-[13px] font-semibold`}
                style={{ color: PRIMARY }}
              >
                View on map &rarr;
              </a>
            )}
          </div>
        </EvidenceRecord>

        <MomentArrow />

        <EvidenceRecord icon={<User size={20} color={PRIMARY} />} label="Who Captured It">
          <div className="flex flex-col gap-0.5">
            <p className={`${inter.className} m-0 text-[17px] font-bold`} style={{ color: "var(--color-foreground)" }}>
              {earliest.capturedBy}
            </p>
            {/* No role/title field exists on the mission record -- omitted
                rather than invented. */}
            <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "var(--color-muted-foreground)" }}>
              {organization}
            </p>
            <p className={`${inter.className} m-0 text-[12px]`} style={{ color: "var(--color-muted-foreground)" }}>
              By AiA Mission Camera
            </p>
          </div>
        </EvidenceRecord>
      </div>
    </section>
  );
}
