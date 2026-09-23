import Link from "next/link";
import { getCurrentContributor } from "@/lib/contributor";
import { getMySharedAct, getMyLatestPublishedAct } from "@/lib/published-acts";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { HomeClient } from "@/components/home/HomeClient";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

// Server Component: reads the signed-in contributor (cookie-based session,
// see lib/contributor.ts) before rendering anything, since that read needs
// the server-side Supabase client. All the existing interactive/effects
// logic (Living Field hooks, Kural Scroll Formation, navigation) stays in
// HomeClient, which now receives the real contributor as a prop instead of
// reading mockContributor/mockJourney directly -- same split as
// components/acts/ActDetailClient.tsx already uses for the same reason.
export default async function HomePage() {
  const contributor = await getCurrentContributor();

  if (!contributor) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 pb-28">
          <Card className="flex flex-col gap-3 text-center">
            <p className="text-lg font-semibold leading-snug">Welcome to Aram in Action</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              See your journey, your Acts of Aram, and your practice of Aram.
            </p>
            <Link href="/onboarding/welcome">
              <Button className="mt-1 w-full">Get Started</Button>
            </Link>
            <Link href="/sign-in" className="text-sm text-[var(--color-muted-foreground)] underline">
              Already have an account? Sign in
            </Link>
          </Card>
        </main>
        <BottomNavigation active="home" />
      </div>
    );
  }

  const [sharedAct, latestAct, unreadNotificationCount] = await Promise.all([
    getMySharedAct(),
    getMyLatestPublishedAct(),
    getUnreadNotificationCount(),
  ]);

  return (
    <HomeClient
      contributor={contributor}
      sharedAct={sharedAct}
      latestAct={latestAct}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
