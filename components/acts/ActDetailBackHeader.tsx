import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Header for the drill-down detail pages (Impact, Location, Timeline,
 * Verification, Records). Deliberately no BottomNavigation on these pages
 * -- they're transient detail views reached from Act Detail's chip grid,
 * not primary destinations, so repeating the tab bar would be misleading
 * wayfinding.
 */
export function ActDetailBackHeader({ actId, title }: { actId: string; title: string }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-6">
      <Link
        href={`/acts/${actId}`}
        aria-label="Back to Act detail"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)]"
      >
        <ChevronLeft size={18} />
      </Link>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
}
