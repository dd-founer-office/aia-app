import { Home as HomeIcon, Sparkles, BookOpen, User as UserIcon } from "lucide-react";
import {
  mockContributor,
  mockJourney,
  mockParticipations,
  mockParticipationCauses,
  mockCauses,
  getCurrentMonthParticipation,
} from "@/lib/mock-data";
import { STAGE_LABELS, STAGE_ORDER } from "@/types";

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
          <p className="text-sm text-[var(--color-muted-foreground)]">Welcome back,</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mockContributor.display_name}
          </h1>
          <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <span className="text-3xl leading-none" aria-hidden>
              {stage.emoji}
            </span>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Current stage
              </span>
              <span className="text-base font-medium">
                {stage.en}{" "}
                <span className="text-[var(--color-muted-foreground)]">Â· {stage.ta}</span>
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            You&apos;ve shown up for {mockJourney.continuity_month_count} months in a row.
            {nextStage ? ` Keep going to grow toward ${nextStage.en}.` : ""}
          </p>
        </section>

        {/* This Month's Participation */}
        <section className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
            This month&apos;s participation
          </h2>

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
              <button
                type="button"
                className="w-full rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:opacity-90"
              >
                Begin this month&apos;s participation
              </button>
            </div>
          )}
        </section>

        {/* Latest Act of Aram -- no backing entity in Sprint 1 schema; empty state */}
        <section className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
            Latest Act of Aram
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No Acts of Aram have been published yet. Once your participation is executed and
            documented, it will appear here.
          </p>
        </section>

        {/* Shared Acts of Aram -- no backing entity in Sprint 1 schema; empty state */}
        <section className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
            Shared Acts of Aram
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            When your participation joins others toward the same Act of Aram, it will be shown
            here.
          </p>
        </section>
      </main>

      {/* Bottom navigation -- visual chrome for the 4-tab MVP architecture.
          Only Home is a real destination in this commit; the rest are
          inactive placeholders pending their own commits. */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="mx-auto flex max-w-md justify-between px-6 py-3">
          <NavItem icon={<HomeIcon size={24} />} label="Home" active />
          <NavItem icon={<Sparkles size={24} />} label="Acts" />
          <NavItem icon={<BookOpen size={24} />} label="Journey" />
          <NavItem icon={<UserIcon size={24} />} label="Profile" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        active ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </div>
  );
}
