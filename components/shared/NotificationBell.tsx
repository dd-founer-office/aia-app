import Link from "next/link";
import { Bell } from "lucide-react";

/** Phase 4 Notifications' entry point. Not a 5th bottom-nav tab --
 *  CA-009's own locked "Navigation Architecture (MVP): only four tabs" --
 *  so this lives as a header icon on Home instead. */
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link href="/notifications" aria-label="Notifications" className="relative inline-flex items-center justify-center p-1">
      <Bell size={22} className="text-[var(--color-foreground)]" strokeWidth={1.75} />
      {unreadCount > 0 && (
        <span
          className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"
          style={{ backgroundColor: "var(--color-error)" }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
