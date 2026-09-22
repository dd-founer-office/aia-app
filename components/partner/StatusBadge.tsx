import type { PartnerActivityBadge } from "@/lib/partner-portal";

const LABEL: Record<PartnerActivityBadge, string> = {
  today: "TODAY",
  assigned: "ASSIGNED",
  submitted: "SUBMITTED",
  completed: "COMPLETED",
};

/** Color is reserved for the live/actionable state only (locked design
 *  rule) -- "assigned"/"submitted"/"completed" differ by weight/opacity,
 *  never a new hue, since the approved palette is exactly five colors. */
export function StatusBadge({ badge }: { badge: PartnerActivityBadge }) {
  const isToday = badge === "today";
  const isCompleted = badge === "completed";
  const isSubmitted = badge === "submitted";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12.5px] font-semibold"
      style={{
        background: isToday ? "var(--pp-mint)" : isCompleted ? "var(--pp-white)" : "var(--pp-surface)",
        color: isToday ? "var(--pp-mint-foreground)" : "var(--pp-text)",
        opacity: isCompleted || isSubmitted ? 0.75 : 1,
        border: isCompleted ? "1.5px solid rgba(6,32,35,.15)" : undefined,
      }}
    >
      {isCompleted && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {LABEL[badge]}
    </span>
  );
}
