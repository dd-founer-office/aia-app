"use client";

import { useId, useState, useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import localFont from "next/font/local";
import { ChevronDown, ChevronRight, HeartHandshake, Landmark, ShieldCheck, Users } from "lucide-react";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

// Reuses ActDetailHero/ActSnapshot/ActEvidence's exact teal/mint/pale-mint
// trio -- the same dark-green surface and light accountability-panel tone
// used everywhere else on this page, not a new palette for this section.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

function subscribeToReducedMotionChanges(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function readReducedMotionOnClient(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function readReducedMotionOnServer(): boolean {
  return false;
}

/**
 * One entry's real data -- what the record says, and the id that opens
 * its underlying record. href is intentionally optional: no deeper
 * Contribution/Allocation/Impact/Verification routes exist in this app
 * yet, so every id below renders as a real, focusable, clickable control
 * with nowhere invented to send it -- never a fake page, never a dead
 * decorative label. Passing href later is how a real route gets wired in,
 * with no change needed here or at any call site.
 */
export interface ImpactRecordEntry {
  dataLabel: string;
  dataValue: string;
  recordId: string;
  href?: string;
}

export interface ContributionImpactRecordData {
  contribution: ImpactRecordEntry;
  allocation: ImpactRecordEntry;
  impact: ImpactRecordEntry;
  verification: ImpactRecordEntry;
}

const ENTRY_META: { key: keyof ContributionImpactRecordData; number: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }[] = [
  { key: "contribution", number: "01", label: "Contribution", icon: HeartHandshake },
  { key: "allocation", number: "02", label: "Allocation", icon: Landmark },
  { key: "impact", number: "03", label: "Impact", icon: Users },
  { key: "verification", number: "04", label: "Verification", icon: ShieldCheck },
];

function RecordIdPill({ recordId, href }: { recordId: string; href?: string }) {
  const className = `${inter.className} inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-3.5 py-2 transition-opacity hover:opacity-80`;
  const style = { background: MINT };
  const content = (
    <>
      <span className="text-[12px] font-semibold" style={{ color: TEAL }}>
        {recordId}
      </span>
      <ChevronRight size={14} color={TEAL} aria-hidden="true" />
    </>
  );

  // No underlying route exists yet for any of these ids (see
  // ImpactRecordEntry's own comment) -- a real <button>, not a disabled
  // look, so it reads as "clickable, not wired up" rather than "broken".
  if (href) {
    return (
      <a href={href} className={className} style={style}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} style={style}>
      {content}
    </button>
  );
}

// The icon cell fills its column flush -- edge to edge, no overflow past
// the row's own top/bottom (reference: founder-supplied close-up of a
// single flush teal row) -- holding a smaller mint circular badge with
// the dark-teal icon inside it.
function FlushIconCell({ icon: Icon, isFirst }: { icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>; isFirst: boolean }) {
  return (
    <div
      className={`flex w-1/2 items-center justify-center ${isFirst ? "rounded-tl-[16px]" : ""}`}
      style={{ background: TEAL }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: MINT }}>
        <Icon size={17} strokeWidth={2} color={TEAL} />
      </div>
    </div>
  );
}

const ROW_DIVIDER = { borderTop: `1px solid var(--color-border)` };

function ImpactRecordRows({
  number,
  label,
  icon,
  entry,
  isFirst,
  isLast,
}: {
  number: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  entry: ImpactRecordEntry;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <>
      {/* Icon + heading row */}
      <div className="flex" style={isFirst ? undefined : ROW_DIVIDER}>
        <FlushIconCell icon={icon} isFirst={isFirst} />
        <div
          className={`flex w-1/2 flex-col items-center justify-center gap-0.5 py-3.5 ${isFirst ? "rounded-tr-[16px]" : ""}`}
          style={{ background: "#FAFAFA" }}
        >
          <span className={`${inter.className} text-[10px]`} style={{ color: "var(--color-muted-foreground)" }}>
            {number}
          </span>
          <span className={`${inter.className} text-[14px] font-semibold`} style={{ color: "var(--color-foreground)" }}>
            {label}
          </span>
        </div>
      </div>

      {/* Data row -- label/value on the left, the id pill trailing on the right */}
      <div
        className={`flex items-center justify-between gap-3 px-5 py-4 ${isLast ? "rounded-b-[16px]" : ""}`}
        style={{ background: "#FFFFFF", ...ROW_DIVIDER }}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`${inter.className} text-[10px]`} style={{ color: "var(--color-muted-foreground)" }}>
            {entry.dataLabel}
          </span>
          <span className={`${inter.className} break-words text-[14px] font-semibold`} style={{ color: "var(--color-foreground)" }}>
            {entry.dataValue}
          </span>
        </div>
        <RecordIdPill recordId={entry.recordId} href={entry.href} />
      </div>
    </>
  );
}

/**
 * Act Detail's accountability layer -- an accordion, collapsed by
 * default, replacing the previous "View Living Trace" navigation button
 * in place (see PublishedActDetail.tsx). Expanding it reveals four
 * stacked cards (Contribution -> Allocation -> Impact -> Verification),
 * each a compact record pointer rather than a repeated narrative: the
 * Act Detail page above already tells the story, this section only
 * answers "can I trust it, and where's the receipt."
 *
 * Pure presentation -- data is a prop so the same component serves any
 * Act once its own contribution/allocation/impact/verification ids
 * exist; nothing here is Annadhanam-specific (that content lives in
 * lib/act-content-overrides.ts, passed in by the caller).
 */
export function ContributionImpactRecord({ data }: { data: ContributionImpactRecordData }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChanges,
    readReducedMotionOnClient,
    readReducedMotionOnServer
  );

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`${inter.className} flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-3.5 text-center transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
        style={{ background: TEAL, outlineColor: MINT }}
      >
        <ChevronDown
          size={16}
          color={MINT}
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: reducedMotion ? "none" : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        <span className="text-[14px] font-medium" style={{ color: "#FFFFFF" }}>
          View What Happened With Your Contribution
        </span>
        <ChevronDown
          size={16}
          color={MINT}
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: reducedMotion ? "none" : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: reducedMotion ? "none" : "grid-template-rows 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div
            id={panelId}
            role="region"
            aria-label="Contribution Impact Record"
            // Keeps the panel's buttons out of tab order and assistive-tech
            // reach while collapsed, without affecting the height/opacity
            // transition itself (inert doesn't touch layout or paint).
            inert={!open}
            style={{
              opacity: open ? 1 : 0,
              transition: reducedMotion ? "none" : "opacity 250ms ease",
              transitionDelay: !reducedMotion && open ? "120ms" : "0ms",
            }}
            className="flex flex-col gap-4 pt-5"
          >
            <div className="flex flex-col gap-1">
              <h2 className={`${calSans.className} m-0 text-[19px] font-bold`} style={{ color: TEAL }}>
                Contribution Impact Record
              </h2>
              <p className={`${inter.className} m-0 text-[13px] leading-[1.5]`} style={{ color: "var(--color-muted-foreground)" }}>
                A traceable record of where your contribution went and what it made possible.
              </p>
            </div>

            <div className="border" style={{ borderColor: "var(--color-border)", borderRadius: 16 }}>
              {ENTRY_META.map(({ key, number, label, icon }, index) => (
                <ImpactRecordRows
                  key={key}
                  number={number}
                  label={label}
                  icon={icon}
                  entry={data[key]}
                  isFirst={index === 0}
                  isLast={index === ENTRY_META.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
