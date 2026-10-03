import Link from "next/link";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Calendar, MapPin, ChevronDown, User } from "lucide-react";
import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

const TEAL = "#0A363A";
// Existing --color-primary (globals.css) -- the icon/accent color on the
// reference's own white cards, reused here rather than a one-off green.
const PRIMARY = "#328D63";
// Existing --color-background (globals.css) -- the app's own very-light
// mint page background, reused here for the icon badges AND (at low
// opacity) for the section's soft atmospheric glow.
const APP_BG = "#EFF4F2";

function MomentArrow() {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: TEAL }}>
        <ChevronDown size={12} color="#FFFFFF" />
      </div>
    </div>
  );
}

function RecordIconBadge({ icon }: { icon: ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
      style={{ background: APP_BG }}
    >
      {icon}
    </div>
  );
}

/**
 * One editorial record, styled after the Abyssale reference's own
 * "When this happens / Do this action" cards: a rounded-square icon
 * badge beside a quiet sentence-case label ending in "...", with the
 * record's real value carried in bold dark text underneath. Narrower
 * than the section's full content width and centered (w-[88%] mx-auto)
 * so it reads as a compact editorial record rather than an edge-to-edge
 * panel, matching the reference's own proportions.
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
      className="mx-auto flex w-[59%] items-start gap-3.5 rounded-[12px] px-5 py-4 text-left"
      style={{
        // Tinted with the same APP_BG mint used for the section's own
        // background glow (rather than opaque var(--color-card) + a hard
        // border) so the card reads as emerging from that color wash --
        // a little more opaque than the glow's own strongest stop so text
        // stays legible.
        background: `${APP_BG}D9`,
        boxShadow: "0 12px 32px rgba(10, 54, 58, 0.06)",
      }}
    >
      <RecordIconBadge icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`${inter.className}`} style={{ fontSize: 9, fontWeight: 500, color: "var(--color-muted-foreground)" }}>
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
        flex: "0 1 31.82%",
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
    <div className="flex items-start justify-center gap-[22px] px-9">
      {left && <SidePhoto src={left} href={href} />}

      <Link
        href={href}
        aria-label="View this photograph in the full Evidence Viewer"
        className="relative z-10 overflow-hidden rounded-[6px]"
        style={{
          aspectRatio: "1 / 1",
          flex: "0 1 36.36%",
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
 * section) on a pure-white background, with a single soft radial glow
 * in the app's own light-mint background color (--color-background)
 * behind the whole composition rather than a visible box. A centered
 * heading/description matching ActTestimonial's exact typography (no
 * eyebrow label), three real capture photos in an asymmetric featured
 * composition, then three WHEN/WHERE/WHO records
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

  return (
    <section
      className="relative -mx-5 flex flex-col items-center gap-8 overflow-hidden px-5 py-10 text-center"
      style={{ background: "#FFFFFF" }}
    >
      {/* Soft atmospheric glow behind the whole composition -- a single
          diffused radial wash in the app's own light-mint background
          color, sitting on top of the pure-white section, not a visible
          box, low enough opacity to read as depth rather than
          decoration. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 0,
          background: `radial-gradient(62% 55% at 50% 32%, ${APP_BG}CC 0%, ${APP_BG}66 45%, ${APP_BG}00 72%)`,
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

      <div className="relative flex w-full flex-col items-stretch gap-[14px]" style={{ zIndex: 1 }}>
        <EvidencePhotoRow photos={photos} href={evidenceHref} />

        <MomentArrow />

        <EvidenceRecord icon={<Calendar size={20} color={PRIMARY} />} label="When it happened ...">
          {earliest.captureDateLong && earliest.captureTimeWithOffset ? (
            <>
              <p className={`${inter.className} m-0 text-[12px] font-bold`} style={{ color: "var(--color-foreground)" }}>
                {earliest.captureDateLong}
              </p>
              <p className={`${inter.className} m-0 text-[9px]`} style={{ color: "var(--color-muted-foreground)" }}>
                {earliest.captureTimeWithOffset}
              </p>
            </>
          ) : (
            // Genuinely missing on the stored evidence row -- never
            // reconstructed. See lib/published-acts.ts's captureDateLong/
            // captureTimeWithOffset comment.
            <p className={`${inter.className} m-0 text-[9px]`} style={{ color: "var(--color-muted-foreground)" }}>
              Capture time unavailable
            </p>
          )}
        </EvidenceRecord>

        <MomentArrow />

        <EvidenceRecord icon={<MapPin size={20} color={PRIMARY} />} label="Where it happened ...">
          <p className={`${inter.className} m-0 text-[12px] font-bold`} style={{ color: "var(--color-foreground)" }}>
            {earliest.landmark ?? "Location unavailable"}
          </p>
          {hasCoords && (
            // The coordinates themselves are the map link -- keeps this
            // record to exactly 3 lines (eyebrow/body/metadata) instead of
            // a separate "View on map" line.
            <a
              href={mapsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className={`${inter.className} m-0 text-[9px]`}
              style={{ color: PRIMARY }}
            >
              Lat {earliest.trust.lat!.toFixed(4)}° Long {earliest.trust.lng!.toFixed(4)}°
            </a>
          )}
        </EvidenceRecord>

        <MomentArrow />

        <EvidenceRecord icon={<User size={20} color={PRIMARY} />} label="Who captured it ...">
          <p className={`${inter.className} m-0 text-[12px] font-bold`} style={{ color: "var(--color-foreground)" }}>
            {earliest.capturedBy}
          </p>
          {/* No role/title field exists on the mission record -- omitted
              rather than invented. */}
          <p className={`${inter.className} m-0 text-[9px]`} style={{ color: "var(--color-muted-foreground)" }}>
            {organization}
          </p>
        </EvidenceRecord>
      </div>
    </section>
  );
}
