import Link from "next/link";
import { getMyActsFeed } from "@/lib/acts-feed";
import { getCurrentContributor } from "@/lib/contributor";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { ActsFeedClient, ActsEmptyState } from "@/components/acts/ActsFeedClient";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";

export const dynamic = "force-dynamic";

/**
 * CA-010 -- Acts of Aram Feed (Locked v1.0), founder-directed override
 * (2026-09-21): this is a personal-use-case app, so "Acts of Aram" means
 * the signed-in contributor's own published Acts, via getMyActsFeed() --
 * not an org-wide feed, and no longer merged with lib/mock-data.ts's demo
 * Acts (which don't belong to any real contributor). Signed-out visitors
 * get a sign-in prompt, same pattern as app/practice/page.tsx. Featured
 * Impact Selection Rule (Locked) priority 1 ("most recently published
 * act") is still the effective rule, now applied within the contributor's
 * own Acts only.
 */
export default async function ActsPage() {
  const contributor = await getCurrentContributor();

  if (!contributor) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 pb-28">
          <Card className="flex flex-col gap-3 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sign in to see your Acts of Aram.
            </p>
            <Link href="/sign-in">
              <Button className="w-full">Sign in</Button>
            </Link>
          </Card>
        </main>
        <BottomNavigation active="acts" />
      </div>
    );
  }

  const acts = await getMyActsFeed();

  const [featured, ...rest] = acts;
  const sharedActs = rest.filter((act) => act.isSharedAct);
  const recentActs = rest.filter((act) => !act.isSharedAct);

  return (
    // NOTE: bg-[var(--color-background)] intentionally removed from this
    // root wrapper -- body already carries this exact background color
    // (globals.css), so this class was a redundant duplicate paint that
    // silently hid the Living Field's ambient canvas. Same fix as
    // app/page.tsx (Sprint 01 Foundation Completion). No other change.
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pb-28 pt-10">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">Acts of Aram</h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
            Your verified acts of impact.
          </p>
        </div>

        {acts.length > 0 ? (
          <ActsFeedClient featured={featured ?? null} recentActs={recentActs} sharedActs={sharedActs} />
        ) : (
          <ActsEmptyState />
        )}
      </main>

      <BottomNavigation active="acts" />
    </div>
  );
}
