import Link from "next/link";
import type { ReactNode } from "react";
import { getJourneyDetail } from "@/lib/journey";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { JourneyTimeline } from "@/components/home/JourneyTimeline";
import { JourneyHero } from "@/components/journey/JourneyHero";
import { ContinuitySection } from "@/components/journey/ContinuitySection";
import { NextStageSection } from "@/components/journey/NextStageSection";
import { ExpressionsOfAramSection } from "@/components/journey/ExpressionsOfAramSection";
import { PersonalReflectionSection } from "@/components/journey/PersonalReflectionSection";
import { JourneyMilestonesSection } from "@/components/journey/JourneyMilestonesSection";

function JourneyShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-32">
      <header className="px-5 pb-2 pt-6">
        <h1 className="font-display text-2xl">Aram Journey</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Your practice of Aram over time.
        </p>
      </header>
      {children}
      <BottomNavigation active="practice" />
    </div>
  );
}

// CA-012 Aram Journey (Locked v1.0) -- "the identity and continuity center
// of Aram in Action." Replaces the earlier "Coming soon" placeholder now
// that both this screen's spec and the continuity/stage-progression logic
// it depends on (Sprint 1 Tasks 7-8, see the apply_participation_to_journey
// DB trigger) exist. Server Component: everything here is a read-only,
// per-request fetch via the cookie-authenticated Supabase client -- no
// client-side interactivity on this screen.
export default async function PracticePage() {
  const journey = await getJourneyDetail();

  if (!journey) {
    return (
      <JourneyShell>
        <main className="px-5">
          <Card className="flex flex-col gap-3 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sign in to see your Aram Journey.
            </p>
            <Link href="/sign-in">
              <Button className="w-full">Sign in</Button>
            </Link>
          </Card>
        </main>
      </JourneyShell>
    );
  }

  // Empty State (New User) -- locked copy verbatim.
  if (!journey.hasParticipated) {
    return (
      <JourneyShell>
        <main className="flex flex-col items-center gap-4 px-5 pt-10 text-center">
          <span className="text-4xl">🌱</span>
          <p className="text-base text-[var(--color-foreground)]">
            Your journey begins with your first Act of Aram.
          </p>
          <Link href="/participate/causes" className="w-full max-w-xs">
            <Button className="w-full">Participate This Month</Button>
          </Link>
        </main>
      </JourneyShell>
    );
  }

  return (
    <JourneyShell>
      <main className="flex flex-col gap-5 px-5">
        <JourneyHero
          currentStage={journey.currentStage}
          continuityMonthCount={journey.continuityMonthCount}
          lifetimeParticipationCount={journey.lifetimeParticipationCount}
        />

        <JourneyTimeline currentStage={journey.currentStage} reachedAtByStage={journey.stageReachedAt} />

        <ContinuitySection
          continuityMonthCount={journey.continuityMonthCount}
          longestContinuityMonthCount={journey.longestContinuityMonthCount}
          lifetimeParticipationCount={journey.lifetimeParticipationCount}
          firstParticipationDateIso={journey.firstParticipationDateIso}
        />

        <NextStageSection
          nextStageRequirement={journey.nextStageRequirement}
          currentParticipations={journey.lifetimeParticipationCount}
          currentContinuityMonths={journey.continuityMonthCount}
        />

        <ExpressionsOfAramSection causeDistribution={journey.causeDistribution} />

        <PersonalReflectionSection reflectionLines={journey.reflectionLines} />

        <JourneyMilestonesSection milestones={journey.milestones} />
      </main>
    </JourneyShell>
  );
}
