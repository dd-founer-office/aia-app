import { getPartnerAuthState } from "@/lib/partner";
import { getPartnerActivities } from "@/lib/partner-portal";
import { PartnerSignedOutCard, PartnerNotAuthorizedCard } from "@/components/partner/PartnerAuthGate";
import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";
import { ActivityCard } from "@/components/partner/ActivityCard";

export const dynamic = "force-dynamic";

export default async function PartnerActivitiesPage() {
  const auth = await getPartnerAuthState();
  if (auth.status === "signed-out") return <PartnerSignedOutCard />;
  if (auth.status === "not-authorized") return <PartnerNotAuthorizedCard />;

  const activities = await getPartnerActivities();
  const today = activities.filter((a) => a.bucket === "today");
  const upcoming = activities.filter((a) => a.bucket === "upcoming");
  const completed = activities.filter((a) => a.bucket === "completed");

  return (
    <div className="partner-portal flex min-h-dvh flex-col">
      <main className="flex-1 overflow-auto px-6 pb-6 pt-7">
        <h1 className="mb-8 text-[32px] leading-[1.08]">Activities</h1>

        {activities.length === 0 && (
          <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
            <p className="text-[16px] font-semibold">Nothing assigned yet</p>
            <p className="max-w-[230px] text-[14px] opacity-55">AiA will notify you here once an activity is ready for your organization.</p>
          </div>
        )}

        {today.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 text-[17px] font-semibold">Today</div>
            <div className="flex flex-col gap-3">
              {today.map((a) => (
                <ActivityCard key={a.executionId} activity={a} />
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 text-[17px] font-semibold">Upcoming</div>
            <div className="flex flex-col gap-3">
              {upcoming.map((a) => (
                <ActivityCard key={a.executionId} activity={a} />
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <div className="mb-3 text-[17px] font-semibold">Completed</div>
            <div className="flex flex-col gap-3">
              {completed.map((a) => (
                <ActivityCard key={a.executionId} activity={a} />
              ))}
            </div>
          </div>
        )}
      </main>
      <PartnerBottomNav />
    </div>
  );
}
