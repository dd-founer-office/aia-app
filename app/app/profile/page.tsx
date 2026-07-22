import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/shared/Button";
import { ChevronRight } from "lucide-react";
import { STAGE_LABELS, type StageName } from "@/types";
import {
  mockContributor,
  mockJourney,
  mockProfileMeta,
  getCauseDistribution,
  getLifetimeActsCount,
  getFirstParticipationDate,
  mockParticipations,
} from "@/lib/mock-data";
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

function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const hasParticipated = mockParticipations.some((p) => p.status === "completed");
  const StageIcon = STAGE_ICONS[mockJourney.current_stage];
  const stageLabel = STAGE_LABELS[mockJourney.current_stage];
  const causeDistribution = getCauseDistribution();
  const firstParticipationDate = getFirstParticipationDate();

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
            No public profile info, no public sharing anywhere on this screen. */}
        <Card>
          <p className="text-lg font-medium">{mockContributor.display_name}</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {mockProfileMeta.country}
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">
            Member since {formatMonthYear(mockContributor.created_at)}
          </p>
        </Card>

        {!hasParticipated && (
          <Card>
            <p className="text-base font-medium">Welcome to your practice of Aram.</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Participate this month to begin building your practice of Aram.
            </p>
            <Button className="mt-4" variant="primary">
              Participate This Month
            </Button>
          </Card>
        )}

        {/* Section 2 -- Practice Snapshot (Amended per Suresh, replaces the
            locked "Journey Snapshot"). Read-only. No "View Full Journey"
            CTA, no link, no Coming Soon placeholder -- Living Kolam will
            only be reachable from its own future bottom-nav tab. */}
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
                {mockJourney.continuity_month_count} month
                {mockJourney.continuity_month_count === 1 ? "" : "s"} of continuity
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-[var(--color-border)] pt-3 text-sm">
            <div>
              <p className="text-[var(--color-muted-foreground)]">Practising since</p>
              <p className="font-medium">{formatMonthYear(mockContributor.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-[var(--color-muted-foreground)]">Lifetime Acts</p>
              <p className="font-medium">{getLifetimeActsCount()}</p>
            </div>
          </div>
        </Card>

        {/* Section 3 -- Participation Summary (Locked, unchanged).
            Continuity before counts. No financial totals or amounts. */}
        <section>
          <SectionHeader title="Participation Summary" />
          <Card className="mt-3">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-[var(--color-muted-foreground)]">Longest continuity</dt>
              <dd className="text-right font-medium">
                {mockProfileMeta.longest_continuity_month_count} months
              </dd>
              <dt className="text-[var(--color-muted-foreground)]">Current continuity</dt>
              <dd className="text-right font-medium">
                {mockJourney.continuity_month_count} months
              </dd>
              <dt className="text-[var(--color-muted-foreground)]">Lifetime participations</dt>
              <dd className="text-right font-medium">{getLifetimeActsCount()}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Published acts</dt>
              <dd className="text-right font-medium">{mockProfileMeta.published_acts_count}</dd>
              <dt className="text-[var(--color-muted-foreground)]">First participation</dt>
              <dd className="text-right font-medium">
                {firstParticipationDate ? formatMonthYear(firstParticipationDate) : "—"}
              </dd>
            </dl>
          </Card>
        </section>

        {/* Section 4 -- Expressions of Aram (Locked). Distribution by
            participation count, never contribution amount. */}
        <section>
          <SectionHeader title="Expressions of Aram" />
          <Card className="mt-3 flex flex-col gap-3">
            {causeDistribution.map(({ cause, percentage }) => (
              <div key={cause.id} className="flex items-center gap-3">
                <span className="w-24 text-sm">{cause.name}</span>
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
            ))}
          </Card>
        </section>

        {/* Section 5 -- Account Settings (Locked, minimal). Static rows --
            Sprint 1 auth isn't built yet, so these have no real
            destinations. Wire up once auth ships. */}
        <section>
          <SectionHeader title="Account Settings" />
          <Card className="mt-3 divide-y divide-[var(--color-border)] p-0">
            {["Personal details", "Communication preferences", "Privacy settings", "Logout"].map(
              (label) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  {label}
                  <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
                </div>
              )
            )}
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
