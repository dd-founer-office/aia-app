import Link from "next/link";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/shared/Button";
import { ChevronRight } from "lucide-react";
import { STAGE_LABELS, type StageName } from "@/types";
import { getProfileDetail } from "@/lib/profile";
import { formatMonthYear } from "@/lib/format";
import { signOutAction } from "@/lib/auth-actions";
import { VidhaiSeedIcon } from "@/components/home/icons/VidhaiSeedIcon";
import { ThulirSproutIcon } from "@/components/home/icons/ThulirSproutIcon";
import { KandruSaplingIcon } from "@/components/home/icons/KandruSaplingIcon";
import { MaramTreeIcon } from "@/components/home/icons/MaramTreeIcon";
import { VanamForestIcon } from "@/components/home/icons/VanamForestIcon";
import type { ComponentType, SVGProps } from "react";

const STAGE_ICONS: Record<StageName, ComponentType<SVGProps<SVGSVGElement>>> = {
  vidhai: VidhaiSeedIcon,
  thulir: ThulirSproutIcon,
  kandru: KandruSaplingIcon,
  maram: MaramTreeIcon,
  vanam: VanamForestIcon,
};

// CA-013 Profile (Locked v1.0), now wired to real data -- was entirely on
// mock-data.ts until this build. Reuses lib/profile.ts (CA-013's own
// fetch, sharing cause-distribution math with lib/journey.ts) rather than
// getJourneyDetail() directly, since this screen doesn't need Journey's
// milestones/reflection/next-stage computations.
export default async function ProfilePage() {
  const profile = await getProfileDetail();

  if (!profile) {
    return (
      <div className="min-h-screen pb-32">
        <header className="px-5 pb-2 pt-6">
          <h1 className="font-display text-2xl">Profile</h1>
        </header>
        <main className="px-5">
          <Card className="flex flex-col gap-3 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sign in to see your Profile.
            </p>
            <Link href="/sign-in">
              <Button className="w-full">Sign in</Button>
            </Link>
          </Card>
        </main>
        <BottomNavigation active="profile" />
      </div>
    );
  }

  const StageIcon = STAGE_ICONS[profile.currentStage];
  const stageLabel = STAGE_LABELS[profile.currentStage];

  return (
    // NOTE: bg-[var(--color-background)] intentionally removed from this
    // root wrapper -- body already carries this exact background color
    // (globals.css), so this class was a redundant duplicate paint that
    // silently hid the Living Field's ambient canvas. Same fix as
    // app/page.tsx (Sprint 01 Foundation Completion). No other change.
    <div className="min-h-screen pb-32">
      <header className="px-5 pt-6 pb-2">
        <h1 className="font-display text-2xl">Profile</h1>
      </header>

      <main className="flex flex-col gap-5 px-5">
        {/* Section 1 -- Profile Header (Locked). Country only, no city.
            No public profile info, no public sharing anywhere on this screen.
            country is nullable (no collection flow exists yet) -- shown only
            when set, never a fabricated default. */}
        <Card>
          <p className="text-lg font-medium">{profile.displayName}</p>
          {profile.country && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{profile.country}</p>
          )}
          <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">
            Member since {formatMonthYear(profile.memberSinceIso)}
          </p>
        </Card>

        {!profile.hasParticipated && (
          <Card>
            <p className="text-base font-medium">Welcome to your Aram Journey.</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Participate this month to begin building your practice of Aram.
            </p>
            <Link href="/participate/causes">
              <Button className="mt-4" variant="primary">
                Participate This Month
              </Button>
            </Link>
          </Card>
        )}

        {/* Section 2 -- Journey Snapshot (Locked, compact). "View Full
            Journey" now links to /practice -- that CTA was previously
            dropped by explicit founder direction because no real Journey
            screen existed yet to link to ("Living Kolam will only be
            reachable from its own future bottom-nav tab"). CA-012 shipped
            that screen, so the CTA's original blocker is gone; restoring
            it per the locked spec rather than leaving a dead-end snapshot. */}
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-primary)]">
              <StageIcon style={{ height: "2em" }} />
            </span>
            <div>
              <p className="text-base font-medium">
                {stageLabel.en} · {stageLabel.ta}
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {profile.continuityMonthCount} month
                {profile.continuityMonthCount === 1 ? "" : "s"} of continuity
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-[var(--color-border)] pt-3 text-sm">
            <div className="flex gap-6">
              <div>
                <p className="text-[var(--color-muted-foreground)]">Practising since</p>
                <p className="font-medium">{formatMonthYear(profile.memberSinceIso)}</p>
              </div>
              <div>
                <p className="text-[var(--color-muted-foreground)]">Lifetime Acts</p>
                <p className="font-medium">{profile.lifetimeParticipationCount}</p>
              </div>
            </div>
            <Link href="/practice">
              <Button variant="text">View Full Journey →</Button>
            </Link>
          </div>
        </Card>

        {/* Section 3 -- Participation Summary (Locked). Continuity before
            counts. No financial totals or amounts. "Published acts" is
            omitted for now -- it needs a real Act of Aram/publication
            entity, which doesn't exist yet (Milestone 3, Trust Layer);
            same status as Home's "Your Latest Act of Aram" section. Showing
            0 would misrepresent an unknown as a confirmed zero. */}
        <section>
          <SectionHeader title="Participation Summary" />
          <Card className="mt-3">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[var(--color-muted-foreground)]">Longest continuity</dt>
              <dd className="text-right font-medium">
                {profile.longestContinuityMonthCount} month
                {profile.longestContinuityMonthCount === 1 ? "" : "s"}
              </dd>
              <dt className="text-[var(--color-muted-foreground)]">Current continuity</dt>
              <dd className="text-right font-medium">
                {profile.continuityMonthCount} month{profile.continuityMonthCount === 1 ? "" : "s"}
              </dd>
              <dt className="text-[var(--color-muted-foreground)]">Lifetime participations</dt>
              <dd className="text-right font-medium">{profile.lifetimeParticipationCount}</dd>
              <dt className="text-[var(--color-muted-foreground)]">First participation</dt>
              <dd className="text-right font-medium">
                {profile.firstParticipationDateIso
                  ? formatMonthYear(profile.firstParticipationDateIso)
                  : "—"}
              </dd>
            </dl>
          </Card>
        </section>

        {/* Section 4 -- Expressions of Aram (Locked). Distribution by
            participation count, never contribution amount. */}
        <section>
          <SectionHeader title="Expressions of Aram" />
          <Card className="mt-3 flex flex-col gap-3">
            {profile.causeDistribution.map((cause) => {
              const total = profile.causeDistribution.reduce(
                (sum, c) => sum + c.participationCount,
                0
              );
              const percentage =
                total > 0 ? Math.round((cause.participationCount / total) * 100) : 0;
              return (
                <div key={cause.causeId} className="flex items-center gap-3">
                  <span className="w-24 text-sm">{cause.title}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-badge-inactive-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-[var(--color-muted-foreground)]">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </Card>
        </section>

        {/* Section 5 -- Account Settings (Locked, minimal). "Logout" wired
            to real Supabase Auth (see lib/auth-actions.ts); the other three
            rows still have no real destination yet and stay static
            placeholders. */}
        <section>
          <SectionHeader title="Account Settings" />
          <Card className="mt-3 divide-y divide-[var(--color-border)] p-0">
            {["Personal details", "Communication preferences", "Privacy settings"].map((label) => (
              <div key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
                {label}
                <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
              </div>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm text-[var(--color-error)]"
              >
                Logout
                <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
              </button>
            </form>
          </Card>
        </section>

        {/* Section 6 -- About AiA (Locked). Simple list, low visual weight. */}
        <section>
          <SectionHeader title="About AiA" />
          <Card className="mt-3 divide-y divide-[var(--color-border)] p-0">
            {["About Aram in Action", "Our mission", "Contact support", "Terms", "Privacy policy"].map(
              (label) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  {label}
                  <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
                </div>
              )
            )}
          </Card>
        </section>
      </main>

      <BottomNavigation active="profile" />
    </div>
  );
}
