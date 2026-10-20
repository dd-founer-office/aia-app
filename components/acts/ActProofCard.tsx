import { Calendar, MapPin, Landmark, Quote } from "lucide-react";

// Uses this app's existing global fonts (--font-display / --font-sans,
// wired in app/layout.tsx + app/globals.css) rather than a per-component
// localFont() -- the CalSans/Inter per-component pattern the real Act
// Detail page uses belongs to a separate, unmerged branch; this stays on
// main's own existing font setup.
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
  reflection?: string | null;
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
      <span className="text-xs" style={{ color: "rgba(255, 255, 255, 0.82)" }}>
        {label}
      </span>
    </div>
  );
}

function WhiteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <h3 className="font-display m-0 text-[15px] font-semibold text-[var(--color-foreground)]">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Proof of Act's visual presentation -- styled in the same visual
 * language as the real Act Detail page (teal/mint hero, same card/section
 * rhythm) with sections for the content an operator can genuinely enter
 * by hand: Hero + Snapshot, Story, a Testimonial quote, and a personal
 * Reflection. Reused unchanged by both the operator's live preview
 * (components/ops/ProofOfActClient.tsx, fed directly from in-progress
 * form state) and the public contributor-facing page
 * (app/proof/[id]/page.tsx, fed from the saved record) -- so what an
 * operator previews is pixel-for-pixel what gets shared.
 *
 * Deliberately leaves out three sections the real Act Detail page shows
 * for some acts, because they can't be honestly recreated here:
 *  - A "Verified" / pipeline checklist ("Opportunity Verified / Execution
 *    Completed / Documentation Approved / Published") -- that's only ever
 *    true because a real mission passed Impact Assurance's actual
 *    pipeline. A manually-entered proof never does, so claiming it would
 *    misrepresent the record. The footer below states what IS true
 *    instead: who entered it and when.
 *  - The real page's video testimonial and "Contribution Impact Record"
 *    (real governance record IDs) are literal, hardcoded content tied to
 *    one specific act in this app's source -- not a reusable per-act
 *    feature, and this app has no video upload path at all. The
 *    Testimonial section here is text-only (quote + who said it), entered
 *    by the operator like every other field.
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
  reflection,
  recipientName,
  createdByName,
  createdAtDisplay,
}: ActProofCardProps) {
  const isSent = Boolean(recipientName && createdByName && createdAtDisplay);
  const hasStory = Boolean(storySituation && storyAction && storyOutcome);
  const hasTestimonial = Boolean(testimonialQuote);
  const hasReflection = Boolean(reflection);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero + Snapshot -- one continuous teal surface, same shape as the
          real Act Detail page's hero + Act Snapshot (simplified to plain
          text/icon facts here rather than that page's bespoke animated
          collage, which is geometry built for one specific reference
          image, not a general-purpose component). */}
      <div className="overflow-hidden rounded-[16px]" style={{ background: TEAL }}>
        {heroImageUrl && (
          <div className="w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImageUrl} alt={actTitle} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex flex-col gap-3 px-5 pb-6 pt-7">
          <span
            className="uppercase"
            style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: "rgba(104, 255, 173, 0.68)" }}
          >
            {cause}
          </span>
          <h2 className="font-display m-0" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.18, color: MINT }}>
            {actTitle || "Untitled Act"}
          </h2>
          <p className="m-0" style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255, 255, 255, 0.82)" }}>
            {description || "No description entered yet."}
          </p>

          <div className="mt-1 grid grid-cols-2 gap-2">
            <SnapshotFact icon={<Calendar size={14} />} label={actDateDisplay} />
            <SnapshotFact icon={<Landmark size={14} />} label={organization} />
            {landmark && <SnapshotFact icon={<MapPin size={14} />} label={landmark} />}
          </div>

          {outcomeSummary && (
            <p className="m-0 mt-1 font-semibold" style={{ fontSize: 13.5, color: "#FFFFFF" }}>
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

      {/* Testimonial -- text-only quote + attribution, entered by the
          operator (not the real page's fixed video, which has no
          per-act equivalent here). */}
      {hasTestimonial && (
        <WhiteSection title="In their words">
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
        </WhiteSection>
      )}

      {/* Reflection -- what this act meant, entered by the operator. */}
      {hasReflection && (
        <WhiteSection title="And something stays">
          <p className="m-0 text-sm leading-relaxed text-[var(--color-foreground)]">{reflection}</p>
        </WhiteSection>
      )}

      {/* Provenance footer -- states only what's actually true (who
          entered this and when), never a "Verified" claim. */}
      <div className="border-t border-[var(--color-border)] pt-3">
        {isSent ? (
          <p className="m-0 text-xs text-[var(--color-muted-foreground)]">
            Shared with {recipientName} · Recorded by {createdByName} on {createdAtDisplay}
          </p>
        ) : (
          <p className="m-0 text-xs italic text-[var(--color-muted-foreground)]">Preview — not yet sent.</p>
        )}
      </div>
    </div>
  );
}
