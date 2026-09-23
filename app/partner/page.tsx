import Link from "next/link";
import { getPartnerAuthState } from "@/lib/partner";
import { getPartnerHomeData } from "@/lib/partner-portal";
import { PartnerSignedOutCard, PartnerNotAuthorizedCard } from "@/components/partner/PartnerAuthGate";
import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";
import { ActivityCard } from "@/components/partner/ActivityCard";
import { EndOfListNote } from "@/components/partner/EndOfListNote";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function PartnerHomePage() {
  const auth = await getPartnerAuthState();
  if (auth.status === "signed-out") return <PartnerSignedOutCard />;
  if (auth.status === "not-authorized") return <PartnerNotAuthorizedCard />;

  const data = await getPartnerHomeData(auth.partner.partnerName);
  const hasAnyActivity = data.today || data.upcoming.length > 0 || data.completed.length > 0;

  return (
    <div className="partner-portal flex min-h-dvh flex-col">
      <main className="flex-1 overflow-auto px-6 pb-6 pt-7">
        <div className="mb-8">
          <div className="mb-1 text-[13.5px] opacity-55">{greeting()}</div>
          <h1 className="text-[32px] leading-[1.08]">{data.partnerName}</h1>
        </div>

        {!hasAnyActivity && (
          <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pp-white)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity=".4">
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M8 3v4M16 3v4M3 11h18" />
              </svg>
            </div>
            <p className="text-[16px] font-semibold">Nothing assigned yet</p>
            <p className="max-w-[230px] text-[14px] opacity-55">AiA will notify you here once an activity is ready for your organization.</p>
          </div>
        )}

        {data.today && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl p-5" style={{ background: "var(--pp-deep-teal)" }}>
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-3 py-1 text-[12.5px] font-semibold"
                style={{ background: "var(--pp-mint)", color: "var(--pp-mint-foreground)" }}
              >
                TODAY
              </span>
            </div>
            <div>
              <div className="mb-1.5 text-[14px] font-semibold" style={{ color: "var(--pp-mint)" }}>
                {data.today.cause}
              </div>
              <h2 className="text-[26px] leading-[1.12]" style={{ color: "var(--pp-deep-teal-foreground)" }}>
                {data.today.title}
              </h2>
            </div>
            <Link
              href={`/partner/activities/${data.today.executionId}`}
              className="mt-1 flex items-center justify-between rounded-xl px-4 py-3.5"
              style={{ background: "rgba(255,255,255,.08)" }}
            >
              <span className="text-[14px] font-semibold" style={{ color: "var(--pp-deep-teal-foreground)" }}>
                View activity
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pp-mint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        )}

        {data.upcoming.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 text-[17px] font-semibold">Upcoming</div>
            <div className="flex flex-col gap-3">
              {data.upcoming.map((a) => (
                <ActivityCard key={a.executionId} activity={a} />
              ))}
            </div>
          </div>
        )}

        {data.completed.length > 0 && (
          <div>
            <div className="mb-3 text-[17px] font-semibold">Completed</div>
            <div className="flex flex-col gap-3">
              {data.completed.map((a) => (
                <ActivityCard key={a.executionId} activity={a} />
              ))}
            </div>
          </div>
        )}

        {hasAnyActivity && <EndOfListNote />}
      </main>
      <PartnerBottomNav />
    </div>
  );
}
