// Uses this app's existing global fonts (--font-display / --font-sans,
// wired in app/layout.tsx + app/globals.css) rather than a per-component
// localFont() -- the CalSans/Inter per-component pattern some other Act
// components use belongs to a separate, unmerged branch; this stays on
// main's own existing font setup.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

export interface ActProofCardProps {
  actTitle: string;
  actDateDisplay: string;
  cause: string;
  organization: string;
  landmark: string | null;
  description: string;
  outcomeSummary: string | null;
  heroImageUrl: string | null;
  /** Only set on the real, sent proof -- the live preview omits these and
   *  shows an explicit "not yet sent" line instead, so the two states
   *  (previewing vs. actually delivered) can never be confused for one
   *  another. */
  contributorName?: string;
  createdByName?: string;
  createdAtDisplay?: string;
}

/**
 * Proof of Act's visual presentation -- modeled on the real Act Detail
 * page's hero (same teal/mint surface, same photo-then-title-then-
 * description shape), reused unchanged by both the operator's live
 * preview (components/ops/ProofOfActClient.tsx, fed directly from
 * in-progress form state) and the contributor-facing page
 * (app/proof/[id]/page.tsx, fed from the saved record) -- so what an
 * operator previews is pixel-for-pixel what gets sent, not a separate
 * approximation.
 *
 * Deliberately carries NO "Verified" badge or language, unlike the real
 * Act Detail page's Verification Summary: that claim rests on a mission
 * actually having passed Mission Review's full pipeline
 * (Opportunity -> Execution -> Publish), which a manually-entered proof
 * never does. This card only ever states what was entered and who
 * entered it -- provenance, not verification.
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
  contributorName,
  createdByName,
  createdAtDisplay,
}: ActProofCardProps) {
  const isSent = Boolean(contributorName && createdByName && createdAtDisplay);

  return (
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

        <div className="mt-1 flex flex-col gap-1.5">
          <p className="m-0" style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.65)" }}>
            {actDateDisplay}
            {landmark ? ` · ${landmark}` : ""}
          </p>
          <p className="m-0" style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.65)" }}>
            {organization}
          </p>
          {outcomeSummary && (
            <p className="m-0 mt-0.5 font-semibold" style={{ fontSize: 13.5, color: "#FFFFFF" }}>
              {outcomeSummary}
            </p>
          )}
        </div>

        <div className="mt-3 border-t pt-3" style={{ borderColor: "rgba(255, 255, 255, 0.14)" }}>
          {isSent ? (
            <p className="m-0" style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
              Shared with {contributorName} · Recorded by {createdByName} on {createdAtDisplay}
            </p>
          ) : (
            <p className="m-0 italic" style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
              Preview — not yet sent.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
