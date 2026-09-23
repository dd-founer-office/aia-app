import Link from "next/link";
import { getMyNotifications } from "@/lib/notifications";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";

// Phase 4 Notifications' list screen -- reached via NotificationBell, not
// a 5th bottom-nav tab (CA-009's own locked 4-tab rule). No BottomNavigation
// here for the same reason every other utility screen (sign-in, onboarding)
// omits it -- a plain "Home" link back is enough. Signed-out visitors
// reaching this route directly just see an empty list -- getMyNotifications()
// returns [] rather than throwing for a signed-out session, same
// null-not-error convention getCurrentContributor() already uses -- since
// the bell that links here is itself only ever rendered for a signed-in
// contributor, a dedicated sign-in prompt isn't needed.
export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-10 pb-16">
        <Link href="/" className="text-sm text-[var(--color-muted-foreground)] underline">
          ← Home
        </Link>
        <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          Notifications
        </h1>
        <NotificationsClient notifications={notifications} />
      </main>
    </div>
  );
}
