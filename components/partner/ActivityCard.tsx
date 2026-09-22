import Link from "next/link";
import type { PartnerActivityCard as PartnerActivityCardData } from "@/lib/partner-portal";
import { StatusBadge } from "./StatusBadge";

function formatDate(iso: string | null): string {
  if (!iso) return "Date to be confirmed";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function CauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}

/** Shared card shape for Home's Upcoming/Completed sections and the
 *  Activities list -- one component, no duplicated markup between the
 *  two screens. */
export function ActivityCard({ activity }: { activity: PartnerActivityCardData }) {
  const isCompleted = activity.bucket === "completed";
  return (
    <Link
      href={`/partner/activities/${activity.executionId}`}
      className="flex items-center gap-3 rounded-2xl bg-[var(--pp-white)] p-4"
      style={isCompleted ? { opacity: 0.7 } : undefined}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "var(--pp-surface)" }}>
        <span style={{ opacity: isCompleted ? 1 : 0.7 }}>
          {isCompleted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <CauseIcon />
          )}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold">{activity.title}</div>
        <div className="mt-0.5 text-[13px] opacity-55">
          {activity.cause} · {formatDate(activity.scheduledDateIso)}
          {activity.district ? ` · ${activity.district}` : ""}
        </div>
      </div>
      {!isCompleted && <StatusBadge badge={activity.badge} />}
    </Link>
  );
}
