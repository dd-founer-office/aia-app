import localFont from "next/font/local";
import { Calendar, MapPin, Landmark, Quote, CheckCircle2 } from "lucide-react";

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
// Same two families the real Act Detail page's own components
// (ActDetailHero, ActSnapshot, ActTestimonial, ActEvidence) use, so this
// matches that page's actual typography rather than this app's generic
// --font-display/--font-sans stack.
const calSans = localFont({ src: "../../app/fonts/CalSansVF.woff2", weight: "400 700", display: "swap" });
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

const TEAL = "#0A363A";
const MINT = "#68FFAD";
const MINT_BORDER = "rgba(104, 255, 173, 0.28)";

export interface ActProofCardProps {
  actTitle: string;
  actDateDisplay: string;
  cause: string;
  organization: string;
  landmark: string | null;
  description: string;
  outcomeSummary: string | null;
  heroImageUrl: string | null;
  storySituation?: string | null;
  storyAction?: string | null;
  storyOutcome?: string | null;
  testimonialQuote?: string | null;
  testimonialAttribution?: string | null;
  testimonialVideoUrl?: string | null;
  reflection?: string | null;
  evidence?: { id: string; photoUrl: string; caption: string | null }[];
  /** Only set on the real, sent proof -- the live preview omits these and
   *  shows an explicit "not yet sent" line instead, so the two states
   *  (previewing vs. actually delivered) can never be confused for one
   *  another. */
  recipientName?: string;
  createdByName?: string;
  createdAtDisplay?: string;
}

function SnapshotFact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-[10px] px-3 py-2"
      style={{ border: `1px solid ${MINT_BORDER}`, background: "rgba(255, 255, 255, 0.03)" }}
    >
      <span style={{ color: MINT }}>{icon}</span>
      <span className={`${inter.className} text-xs`} style={{ color: "rgba(255, 255, 255, 0.82)" }}>
        {label}
      </span>
    </div>
  );
}

function WhiteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <h3 className={`${calSans.className} m-0 text-[15px] font-semibold text-[var(--color-foreground)]`}>{title}</h3>
      {children}
    </section>
  );
}

/**
 * Proof of Act's visual presentation -- ported to match the real Act
 * Detail page's actual typography (Cal Sans headings, Inter body) and
 * teal/mint hero treatment, with sections for the content an operator
 * can genuinely enter by hand: Hero + Snapshot, Story, a Testimonial
 * (quote, optional uploaded video), an Evidence photo gallery, and a
 * personal Reflection. Reused unchanged by both the operator's live
 * preview (components/ops/ProofOfActClient.tsx, fed directly from
 * in-progress form state) and the public contributor-facing page
 * (app/proof/[id]/page.tsx, fed from the saved record) -- so what an
 * operator previews is pixel-for-pixel what gets shared.
 *
 * Two deliberate departures from the real page, both explained inline
 * where they render below:
 *  - The real page's Act Snapshot is a geometry-measured animated
 *    collage built for one specific reference image, not a reusable
 *    component for arbitrary content -- this uses a plain icon-fact
 *    grid in the same teal/mint materials instead.
 *  - The real page's "Verified" checklist ("Opportunity Verified /
 *    Execution Completed / Documentation Approved / Published") is only
 *    ever true because a mission passed Impact Assurance's actual
 *    pipeline. A manually-entered proof never does, so this renders the
 *    same card/checkmark treatment with honest content instead --
 *    what's actually true about this record, not a verification claim.
 */
export function ActProofCard({
  actTitle,
  actDateDisplay,
  cause,
  organization,
  landmark,
  description,
  outcomeSummary,
  heroImageUrl,
  storySituation,
  storyAction,
  storyOutcome,
  testimonialQuote,
  testimonialAttribution,
  testimonialVideoUrl,
  reflection,
  evidence,
  recipientName,
  createdByName,
  createdAtDisplay,
}: ActProofCardProps) {
  const isSent = Boolean(recipientName && createdByName && createdAtDisplay);
  const hasStory = Boolean(storySituation && storyAction && storyOutcome);
  const hasTestimonial = Boolean(testimonialQuote || testimonialVideoUrl);
  const hasReflection = Boolean(reflection);
  const evidenceItems = evidence ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Hero + Snapshot -- one continuous teal surface, same shape as the
          real Act Detail page's hero + Act Snapshot (simplified to plain
          icon facts here rather than that page's bespoke animated
          collage -- see this component's own top comment). */}
      <div className="overflow-hidden rounded-[16px]" style={{ background: TEAL }}>
        {heroImageUrl && (
          <div className="w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImageUrl} alt={actTitle} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-3 px-5 pb-6 pt-7">
          <span
            className={`${inter.className} uppercase`}
            style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: "rgba(104, 255, 173, 0.68)" }}
          >
            {cause}
          </span>
          <h2 className={`${calSans.className} m-0`} style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, color: MINT }}>
            {actTitle || "Untitled Act"}
          </h2>
          <p className={`${inter.className} m-0`} style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255, 255, 255, 0.82)" }}>
            {description || "No description entered yet."}
          </p>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <SnapshotFact icon={<Calendar size={14} />} label={actDateDisplay} />
            <SnapshotFact icon={<Landmark size={14} />} label={organization} />
            {landmark && <SnapshotFact icon={<MapPin size={14} />} label={landmark} />}
          </div>

          {outcomeSummary && (
            <p className={`${inter.className} m-0 mt-1 font-semibold`} style={{ fontSize: 13.5, color: "#FFFFFF" }}>
              {outcomeSummary}
            </p>
          )}
        </div>
      </div>

      {/* Story -- situation -> action -> outcome, same shape as the real
          Act Detail page's Story section. Only shown once all three are
          filled, same "doesn't exist yet rather than half-empty" rule
          that page follows. */}
      {hasStory && (
        <WhiteSection title="Story">
          <p className="m-0 text-sm leading-relaxed text-[var(--color-foreground)]">{storySituation}</p>
          <p className="m-0 text-sm leading-relaxed text-[var(--color-foreground)]">{storyAction}</p>
          <p className="m-0 text-sm leading-relaxed text-[var(--color-foreground)]">{storyOutcome}</p>
        </WhiteSection>
      )}

      {/* Testimonial -- an optionally-uploaded video plus a quote +
          attribution, entered by the operator. The real page's
          testimonial is a fixed, hardcoded video/quote for one specific
          act (not data-driven at all); this one is genuinely per-proof. */}
      {hasTestimonial && (
        <WhiteSection title="In their words">
          {testimonialVideoUrl && (
            <video src={testimonialVideoUrl} controls className="w-full rounded-[10px]" style={{ background: TEAL }} />
          )}
          {testimonialQuote && (
            <div className="flex gap-2.5">
              <Quote size={18} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
              <div className="flex flex-col gap-1.5">
                <p className="m-0 text-sm italic leading-relaxed text-[var(--color-foreground)]">
                  &ldquo;{testimonialQuote}&rdquo;
                </p>
                {testimonialAttribution && (
                  <p className="m-0 text-xs text-[var(--color-muted-foreground)]">— {testimonialAttribution}</p>
                )}
              </div>
            </div>
          )}
        </WhiteSection>
      )}

      {/* Evidence -- uploaded photos with an optional caption each,
          echoing the real page's Evidence section. Simplified to
          photo+caption rather than that section's structured
          when/where/who record fields, since those come from the real
          Mission Camera capture pipeline a manual proof never runs
          through. */}
      {evidenceItems.length > 0 && (
        <WhiteSection title="Evidence">
          {evidenceItems.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-[10px]" style={{ background: TEAL }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.photoUrl} alt={item.caption ?? ""} className="w-full object-cover" style={{ aspectRatio: "4 / 3" }} />
              {item.caption && (
                <p className="m-0 px-3 py-2 text-xs" style={{ color: "rgba(255, 255, 255, 0.75)" }}>
                  {item.caption}
                </p>
              )}
            </div>
          ))}
        </WhiteSection>
      )}

      {/* Reflection -- what this act meant, entered by the operator. */}
      {hasReflection && (
        <WhiteSection title="And something stays">
          <p className="m-0 text-sm leading-relaxed text-[var(--color-foreground)]">{reflection}</p>
        </WhiteSection>
      )}

      {/* Closing provenance card -- same card/checkmark treatment as the
          real page's Verification Summary, but stating only what's
          actually true of a manually-entered record, never a pipeline
          verification claim. */}
      <section className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h3 className={`${calSans.className} m-0 text-[15px] font-semibold text-[var(--color-foreground)]`}>Record</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
          <CheckCircle2 size={16} className="shrink-0 text-[var(--color-primary)]" />
          Entered manually by {isSent ? createdByName : "an AiA operator"}
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
          <CheckCircle2 size={16} className="shrink-0 text-[var(--color-primary)]" />
          Reviewed before sharing
        </div>
        {isSent ? (
          <p className="m-0 text-xs text-[var(--color-muted-foreground)]">
            Shared with {recipientName} · {createdAtDisplay}
          </p>
        ) : (
          <p className="m-0 text-xs italic text-[var(--color-muted-foreground)]">Preview — not yet sent.</p>
        )}
      </section>
    </div>
  );
}
