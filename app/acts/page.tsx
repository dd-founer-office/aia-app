import { getMergedActsFeed } from "@/lib/acts-feed";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { ActsFeedClient, ActsEmptyState } from "@/components/acts/ActsFeedClient";

export const dynamic = "force-dynamic";

/**
 * CA-010 -- Acts of Aram Feed (Locked v1.0). Merges the 5 demo Acts
 * (lib/mock-data.ts, kept per founder direction -- pulling them now would
 * shrink the feed to the single real published Act) with real published
 * missions from the Mission Review Workflow (Supabase), via the shared
 * getMergedActsFeed(). Featured Impact Selection Rule (Locked) priority 1
 * ("most recently published act") is the effective rule for MVP: with
 * only 6 acts total right now, the "highest documentation quality"
 * tiebreaker has no real signal to rank on yet.
 */
export default async function ActsPage() {
  const acts = await getMergedActsFeed();

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
            Verified acts of impact.
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
