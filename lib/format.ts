/** "2026-09-16T08:07:15Z" -> "September 2026". Shared across CA-012 Journey's
 *  date displays (Continuity, Journey Path, Journey Milestones). */
export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
