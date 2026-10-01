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
// Existing --color-primary (globals.css) -- reused here for the eyebrow,
// same choice ActTheAct made for a label that needs to read on the page's
// own light background rather than a dark teal surface.
const PRIMARY = "#328D63";

function MomentArrow() {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: TEAL }}>
        <ChevronDown size={16} color="#FFFFFF" />
      </div>
    </div>
  );
}

function EvidenceRecord({
  icon,
  eyebrow,
  children,
}: {
  icon?: ReactNode;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={`${inter.className} uppercase`}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", color: PRIMARY }}
        >
          {eyebrow}
        </span>
      </div>
      {children}
    </div>
  );
}

function EvidencePhotoCluster({ photos, href }: { photos: string[]; href: string }) {
  if (photos.length === 0) return null;

  const [first, second, third] = photos;

  return (
    <div className="relative">
      <Link
        href={href}
        aria-label="View this photograph in the full Evidence Viewer"
        className="block overflow-hidden rounded-[var(--radius-photo)]"
        style={{ aspectRatio: "4 / 3" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={first} alt="" className="h-full w-full object-cover" />
      </Link>

      {(second || third) && (
        <div className="relative z-10 -mt-10 flex gap-3 px-4">
          {second && (
            <Link
              href={href}
              aria-label="View this photograph in the full Evidence Viewer"
              className="flex-1 overflow-hidden rounded-[var(--radius-photo)]"
              style={{
                aspectRatio: "4 / 5",
                boxShadow: "0 10px 24px rgba(10, 54, 58, 0.16)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={second} alt="" className="h-full w-full object-cover" />
            </Link>
          )}
          {third && (
            <Link
              href={href}
              aria-label="View this photograph in the full Evidence Viewer"
              className="mt-5 flex-1 overflow-hidden rounded-[var(--radius-photo)]"
              style={{
                aspectRatio: "4 / 5",
                boxShadow: "0 10px 24px rgba(10, 54, 58, 0.16)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={third} alt="" className="h-full w-full object-cover" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Act Detail's "The Evidence" section -- CA-011's documentary record.
 * Real capture photos first, then three editorial WHEN/WHERE/WHO records
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <span
          className={`${inter.className} uppercase`}
          style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: PRIMARY }}
        >
          The Evidence
        </span>
        <h2
          className={`${calSans.className} m-0 text-[26px] font-bold leading-[1.15]`}
          style={{ color: TEAL, letterSpacing: "-0.3px" }}
        >
          Every moment leaves a trace.
        </h2>
        <p className={`${inter.className} m-0 text-[14px] leading-[1.55]`} style={{ color: "rgba(10, 54, 58, 0.72)" }}>
          The Act was documented as it happened.
        </p>
      </div>

      <EvidencePhotoCluster photos={photos} href={evidenceHref} />

      <MomentArrow />

      <EvidenceRecord icon={<Calendar size={16} color={PRIMARY} />} eyebrow="When It Happened">
        {earliest.captureDateLong && earliest.captureTimeWithOffset ? (
          <div className="flex flex-col gap-0.5">
            <p className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: TEAL }}>
              {earliest.captureDateLong}
            </p>
            <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "rgba(10, 54, 58, 0.65)" }}>
              {earliest.captureTimeWithOffset}
            </p>
          </div>
        ) : (
          // Genuinely missing on the stored evidence row -- never
          // reconstructed. See lib/published-acts.ts's captureDateLong/
          // captureTimeWithOffset comment.
          <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "rgba(10, 54, 58, 0.5)" }}>
            Capture time unavailable
          </p>
        )}
      </EvidenceRecord>

      <MomentArrow />

      <EvidenceRecord icon={<MapPin size={16} color={PRIMARY} />} eyebrow="Where It Happened">
        <div className="flex flex-col gap-2.5">
          {landmarkPrimary ? (
            <div className="flex flex-col gap-0.5">
              <p className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: TEAL }}>
                {landmarkPrimary}
              </p>
              {landmarkSecondary && (
                <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "rgba(10, 54, 58, 0.65)" }}>
                  {landmarkSecondary}
                </p>
              )}
            </div>
          ) : (
            <p className={`${inter.className} m-0 text-[13.5px]`} style={{ color: "rgba(10, 54, 58, 0.5)" }}>
              Location unavailable
            </p>
          )}

          {hasCoords && (
            <p className={`${inter.className} m-0 text-[12.5px] leading-[1.6]`} style={{ color: "rgba(10, 54, 58, 0.55)" }}>
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

      <EvidenceRecord eyebrow="Who Captured It">
        <div className="flex items-center gap-3">
          {/* No profile photo field exists on the mission record -- a
              neutral icon badge, never a fabricated or generic stock
              face, stands in for it. */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(10, 54, 58, 0.08)" }}
          >
            <User size={18} color={PRIMARY} />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: TEAL }}>
              {earliest.capturedBy}
            </p>
            {/* No role/title field exists on the mission record -- omitted
                rather than invented (brief's own rule: never show a role
                that isn't on file). */}
            <p className={`${inter.className} m-0 text-[13px]`} style={{ color: "rgba(10, 54, 58, 0.65)" }}>
              {organization}
            </p>
            <p className={`${inter.className} m-0 text-[12px]`} style={{ color: "rgba(10, 54, 58, 0.5)" }}>
              By AiA Mission Camera
            </p>
          </div>
        </div>
      </EvidenceRecord>
    </section>
  );
}
