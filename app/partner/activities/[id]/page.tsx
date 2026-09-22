import Link from "next/link";
import { notFound } from "next/navigation";
import { getPartnerAuthState } from "@/lib/partner";
import { getPartnerActivityDetail } from "@/lib/partner-portal";
import { PartnerSignedOutCard, PartnerNotAuthorizedCard } from "@/components/partner/PartnerAuthGate";
import { StatusBadge } from "@/components/partner/StatusBadge";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "To be confirmed";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-3.5 last:border-b-0">
      <span className="text-[13.5px] opacity-55">{label}</span>
      <span className="text-right text-[14.5px] font-semibold">{value}</span>
    </div>
  );
}

/** Focused task screen -- no bottom nav (locked rule): navigation gets
 *  you somewhere, this screen gets you to work. Shows only what the
 *  partner needs to execute (what/when/where/what to do); no evidence
 *  list, review status, internal notes, or money figures -- those stay
 *  entirely on the Ops side. */
export default async function PartnerActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await getPartnerAuthState();
  if (auth.status === "signed-out") return <PartnerSignedOutCard />;
  if (auth.status === "not-authorized") return <PartnerNotAuthorizedCard />;

  const { id } = await params;
  const activity = await getPartnerActivityDetail(id);
  if (!activity) notFound();

  const isSubmittedOrDone = activity.badge === "submitted" || activity.badge === "completed";

  return (
    <div className="partner-portal flex min-h-dvh flex-col">
      <div className="flex-shrink-0 px-6 pb-6 pt-5" style={{ background: "var(--pp-deep-teal)" }}>
        <Link href="/partner" aria-label="Back to Home" className="mb-4 inline-flex h-8 w-8 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pp-deep-teal-foreground)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <div className="mb-1.5 flex items-baseline gap-2">
          <span className="text-[14px] font-semibold" style={{ color: "var(--pp-mint)" }}>
            {activity.cause}
          </span>
          {activity.district && <span className="text-[13px]" style={{ color: "rgba(255,255,255,.5)" }}>· {activity.district}</span>}
        </div>
        <h1 className="text-[28px] leading-[1.1]" style={{ color: "var(--pp-deep-teal-foreground)" }}>
          {activity.title}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-6">
        <div className="mb-5">
          <StatusBadge badge={activity.badge} />
        </div>

        <div>
          <Row label="Cause" value={activity.cause} />
          <Row label="Date" value={formatDate(activity.scheduledDateIso)} />
          {activity.district && <Row label="Location" value={activity.district} />}
          {activity.beneficiaryEstimate !== null && <Row label="Beneficiaries" value={`~${activity.beneficiaryEstimate} expected`} />}
        </div>

        {activity.needSummary && (
          <p className="mt-6 text-[15px] leading-[1.55]">{activity.needSummary}</p>
        )}
      </div>

      <div className="flex-shrink-0 bg-[var(--pp-white)] px-6 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
        {isSubmittedOrDone ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[14px] font-semibold" style={{ background: "var(--pp-surface)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity=".7">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {activity.badge === "completed" ? "Evidence submitted" : "Evidence submitted · Awaiting AiA review"}
          </div>
        ) : null}
        <Link
          href={`/capture/${activity.executionId}`}
          aria-label="Open Mission Camera"
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-2xl py-[17px] text-[15px] font-bold"
          style={{ background: "var(--pp-deep-teal)", color: "var(--pp-mint)" }}
        >
          OPEN MISSION CAMERA
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pp-mint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
