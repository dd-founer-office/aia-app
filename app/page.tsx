import { PrayingHandsIcon } from "@/components/home/icons/PrayingHandsIcon";
import {
  mockContributor,
  mockJourney,
  mockParticipations,
  mockParticipationCauses,
  mockCauses,
  getCurrentMonthParticipation,
} from "@/lib/mock-data";
import { STAGE_LABELS, STAGE_ORDER } from "@/types";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

export default function HomePage() {
  const stage = STAGE_LABELS[mockJourney.current_stage];
  const stageIndex = STAGE_ORDER.indexOf(mockJourney.current_stage);
  const nextStageName = STAGE_ORDER[stageIndex + 1];
  const nextStage = nextStageName ? STAGE_LABELS[nextStageName] : null;

  const currentParticipation = getCurrentMonthParticipation();
  const hasParticipatedThisMonth = currentParticipation?.status === "completed";

  const lastCompleted = mockParticipations.find((p) => p.status === "completed");
  const lastCompletedCauseNames = lastCompleted
    ? mockParticipationCauses
        .filter((pc) => pc.participation_id === lastCompleted.id)
        .map((pc) => mockCauses.find((c) => c.id === pc.cause_id)?.name)
        .filter(Boolean)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-28 pt-10">
        {/* Hero */}
        <section className="flex flex-col gap-1">
          <div className="flex items-start gap-3">
            <PrayingHandsIcon
              className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              style={{ height: "2.4em", width: "auto" }}
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                {"\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD"},
                <br />
                {mockContributor.display_name}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
                {"\u0B85\u0BB1\u0BAE\u0BCD \u0B9A\u0BC6\u0BAF \u0BAA\u0BB4\u0B95\u0BC1"}
              </p>
            </div>
          </div>
          <Card className="mt-4 flex items-center gap-3">
            <span className="text-3xl leading-none" aria-hidden>
              {stage.emoji}
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Current stage
              </span>
              <span className="text-base font-medium">
                {stage.en}{" "}
                <span className="text-[var(--color-muted-foreground)]">- {stage.ta}</span>
              </span>
            </div>
          </Card>
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            You&apos;ve shown up for {mockJourney.continuity_month_count} months in a row.
            {nextStage ? ` Keep going to grow toward ${nextStage.en}.` : ""}
          </p>
        </section>

        {/* This Month's Participation */}
        <Card className="flex flex-col gap-3">
          <SectionHeader title="This month's participation" />

          {hasParticipatedThisMonth ? (
            <div className="flex flex-col gap-1">
              <p className="text-base">You&apos;ve participated this month.</p>
              {lastCompletedCauseNames.length > 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Allocated to {lastCompletedCauseNames.join(", ")}.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-base">
                You haven&apos;t participated this month. Your next Act of Aram is waiting.
              </p>
              <Button className="w-full">Begin this month&apos;s participation</Button>
            </div>
          )}
        </Card>

        {/* Latest Act of Aram -- no backing entity in Sprint 1 schema; empty state */}
        <Card className="flex flex-col gap-2">
          <SectionHeader title="Latest Act of Aram" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No Acts of Aram have been published yet. Once your participation is executed and
            documented, it will appear here.
          </p>
        </Card>

        {/* Shared Acts of Aram -- no backing entity in Sprint 1 schema; empty state */}
        <Card className="flex flex-col gap-2">
          <SectionHeader title="Shared Acts of Aram" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            When your participation joins others toward the same Act of Aram, it will be shown
            here.
          </p>
        </Card>
      </main>

      <BottomNavigation active="home" />
    </div>
  );
}
