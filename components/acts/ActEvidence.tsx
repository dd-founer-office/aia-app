"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
const inter = localFont({
  src: "../../app/fonts/InterVF.woff2",
  weight: "100 900",
  display: "swap",
});

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
    <div
      className="ev-arrow flex items-center justify-center"
      aria-hidden="true"
    >
      <div
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
        style={{ background: TEAL }}
      >
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
  changed = false,
  children,
}: {
  icon: ReactNode;
  label: string;
  // True once the centre photo has changed, so the record plays its
  // update animation (a soft outline glow and a quick fade of the text).
  changed?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-changed={changed}
      className="ev-record flex w-full items-start gap-3.5 rounded-[12px] px-5 py-4 text-left"
      style={{
        background: "var(--color-card)",
        boxShadow: "0 12px 32px rgba(10, 54, 58, 0.06)",
      }}
    >
      <RecordIconBadge icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`${inter.className}`}
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-muted-foreground)",
          }}
        >
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

// ---- Photo carousel --------------------------------------------------
// Three photos show at once (previous / current / next); with more than
// three they rotate like a conveyor, and the When/Where/Who cards follow
// whichever photo is in the centre. All photos are the same size; the
// centre one is projected by a 10% scale and a deeper shadow, and sits a
// touch lower. Layout px: SIDE margin, GAP between photos (a bit more than
// the visible gap so the scaled centre photo leaves equal visible spacing).
const SIDE = 10;
const GAP = 14.5;
const CENTRE_SCALE = 1.1;
const CENTRE_DROP = 7; // px; with the scale this puts the top edge ~3px lower
const ROTATE_MS = 4000;
const SLIDE_MS = 700;
const CAROUSEL_CSS = `
  @keyframes ev-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 3px; } }
  .ev-arrow > div { animation: ev-bob 1.8s ease-in-out infinite; }
  @keyframes ev-in { from { opacity: 0; translate: 0 6px; } to { opacity: 1; translate: 0 0; } }
  @keyframes ev-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(50, 141, 99, 0), 0 12px 32px rgba(10, 54, 58, 0.06); }
    30% { box-shadow: 0 0 0 2px rgba(50, 141, 99, 0.55), 0 12px 32px rgba(10, 54, 58, 0.06); }
  }
  .ev-record[data-changed="true"] { animation: ev-glow 900ms ease; }
  .ev-record[data-changed="true"] > div:last-child { animation: ev-in 450ms ease-out; }
  @media (prefers-reduced-motion: reduce) { .ev-arrow > div, .ev-record, .ev-record > div { animation: none !important; } }
`;

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function readReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Relative position of virtual slot `i` to the centre slot `a`, in
// [-floor(m/2), ceil(m/2)-1].
function relative(i: number, a: number, m: number) {
  const half = Math.floor(m / 2);
  return ((((i - a + half) % m) + m) % m) - half;
}

function slotStyle(rel: number, reduced: boolean): React.CSSProperties {
  const s = "100%"; // translateX percentages are of the photo's own width
  const x =
    rel === -1
      ? `${SIDE}px`
      : rel === 0
        ? `calc(${s} + ${SIDE + GAP}px)`
        : rel === 1
          ? `calc(200% + ${SIDE + 2 * GAP}px)`
          : rel < 0
            ? `calc(-100% - ${GAP * 2}px)`
            : `calc(300% + ${SIDE + 4 * GAP}px)`;
  const centre = rel === 0;
  return {
    width: "var(--s)",
    height: "var(--s)",
    transform: `translateX(${x})${centre ? ` translateY(${CENTRE_DROP}px) scale(${CENTRE_SCALE})` : ""}`,
    opacity: rel >= -1 && rel <= 1 ? 1 : 0,
    zIndex: centre ? 3 : rel === -1 || rel === 1 ? 2 : 1,
    boxShadow: centre
      ? "0 18px 36px rgba(10, 54, 58, 0.28)"
      : "0 6px 16px rgba(10, 54, 58, 0.10)",
    pointerEvents: rel >= -1 && rel <= 1 ? "auto" : "none",
    transition: reduced
      ? "none"
      : `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease, box-shadow ${SLIDE_MS}ms ease`,
  };
}

// "Sreenivasanallur, Kumbakonam, Thanjavur" -> "Sreenivasanallur, Thanjavur":
// the village and the district only.
function shortPlace(landmark?: string | null) {
  if (!landmark) return "Location unavailable";
  const parts = landmark
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 2
    ? `${parts[0]}, ${parts[parts.length - 1]}`
    : parts.join(", ");
}

/**
 * Act Detail's "Every moment leaves a trace" section: a three-photo
 * carousel (rotating on its own once there are more than three) over three
 * wide records -- When / Where / Who -- that always describe the centre
 * photo. Mirrors the trace viewer's own data (EvidenceTraceItem).
 */
export function ActEvidence({
  organization,
  evidence,
}: {
  organization: string;
  evidence: EvidenceTraceItem[];
}) {
  const n = evidence.length;
  // Virtual slots: the list repeated enough times (>= 5 slots) that a
  // conveyor always has a hidden slot on each side to slide through.
  const m = n > 3 ? n * Math.ceil(5 / n) : n;
  const [active, setActive] = useState(0);
  const [steps, setSteps] = useState(0);
  const [inView, setInView] = useState(false);
  const [touching, setTouching] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    () => false,
  );
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (n <= 3 || reduced || !inView || touching) return;
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % m);
      setSteps((v) => v + 1);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [n, m, reduced, inView, touching]);

  if (n === 0) return null;

  const current = evidence[active % n];
  const hasCoords = current.trust.lat != null && current.trust.lng != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${current.trust.lat},${current.trust.lng}`
    : null;
  const changed = steps > 0;

  function bringToCentre(i: number) {
    if (i === active) return;
    setActive(i);
    setSteps((v) => v + 1);
  }

  return (
    <section
      ref={sectionRef}
      className="relative -mx-5 flex flex-col items-center gap-8 overflow-hidden px-5 py-10 text-center"
      style={{ background: "#FFFFFF" }}
    >
      <style>{CAROUSEL_CSS}</style>
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
          background: `radial-gradient(62% 55% at 50% 32%, ${APP_BG}D9 0%, ${APP_BG}66 45%, ${APP_BG}00 72%)`,
        }}
      />

      <div
        className="relative flex flex-col gap-2.5 px-2"
        style={{ zIndex: 1 }}
      >
        <h2
          className={`${calSans.className} m-0 text-[24px] font-bold leading-[1.15]`}
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

      <div
        className="relative flex w-full flex-col items-stretch gap-[14px]"
        style={{ zIndex: 1 }}
      >
        {/* Photos. The row is a size container so the photo size is one
            calc: (width - 2 SIDE - 2 GAP) / 3. Its height leaves room for the
            centre photo's drop and scale; the dots below sit in the space that
            keeps the gap under the centre photo equal to the gap above it. */}
        <div style={{ containerType: "inline-size" }}>
          <div
            className="relative"
            style={
              {
                "--s": `calc((100cqw - ${2 * SIDE + 2 * GAP}px) / 3)`,
                height: "calc(var(--s) + 12px)",
              } as React.CSSProperties
            }
            onPointerDown={() => setTouching(true)}
            onPointerUp={() => setTouching(false)}
            onPointerCancel={() => setTouching(false)}
          >
            {Array.from({ length: m }, (_, i) => {
              const item = evidence[i % n];
              const rel = relative(i, active, m);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => bringToCentre(i)}
                  aria-label={`Show ${item.momentTitle}`}
                  className="absolute left-0 top-0 overflow-hidden rounded-[6px] p-0"
                  style={slotStyle(rel, reduced)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photoUrl}
                    alt={item.momentTitle}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-1.5"
          style={{ height: 6, opacity: n > 3 ? 1 : 0 }}
        >
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === active % n ? 18 : 6,
                background: i === active % n ? TEAL : "rgba(10, 54, 58, 0.2)",
                transition: "width 300ms ease, background 300ms ease",
              }}
            />
          ))}
        </div>

        <MomentArrow />

        <EvidenceRecord
          key={`w-${current.id}`}
          changed={changed}
          icon={<Calendar size={20} color={PRIMARY} />}
          label="When it happened ..."
        >
          {current.captureDateLong && current.captureTimeWithOffset ? (
            <>
              <p
                className={`${inter.className} m-0 text-[12px] font-bold`}
                style={{ color: "var(--color-foreground)" }}
              >
                {current.captureDateLong}
              </p>
              <p
                className={`${inter.className} m-0 text-[11px]`}
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {current.captureTimeWithOffset}
              </p>
            </>
          ) : (
            <p
              className={`${inter.className} m-0 text-[11px]`}
              style={{ color: "var(--color-muted-foreground)" }}
            >
              Capture time unavailable
            </p>
          )}
        </EvidenceRecord>

        <MomentArrow />

        <EvidenceRecord
          key={`l-${current.id}`}
          changed={changed}
          icon={<MapPin size={20} color={PRIMARY} />}
          label="Where it happened ..."
        >
          <p
            className={`${inter.className} m-0 text-[12px] font-bold`}
            style={{ color: "var(--color-foreground)" }}
          >
            {shortPlace(current.landmark)}
          </p>
          {hasCoords && (
            <a
              href={mapsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className={`${inter.className} m-0 text-[11px]`}
              style={{ color: PRIMARY }}
            >
              {current.trust.lat!.toFixed(4)}, {current.trust.lng!.toFixed(4)}
            </a>
          )}
        </EvidenceRecord>

        <MomentArrow />

        <EvidenceRecord
          key={`c-${current.id}`}
          changed={changed}
          icon={<User size={20} color={PRIMARY} />}
          label="Who captured it ..."
        >
          <p
            className={`${inter.className} m-0 text-[12px] font-bold`}
            style={{ color: "var(--color-foreground)" }}
          >
            {current.capturedBy}
          </p>
          {/* No role/title field exists on the mission record -- omitted
              rather than invented. */}
          <p
            className={`${inter.className} m-0 text-[11px]`}
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {organization}
          </p>
        </EvidenceRecord>
      </div>
    </section>
  );
}
