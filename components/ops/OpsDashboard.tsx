import Link from "next/link";
import { STAGE_LABELS, STAGE_ORDER } from "@/types";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { opsSignOutAction } from "@/lib/ops-auth-actions";
import type { OpsDashboardData } from "@/lib/ops-dashboard";

const URGENCY_DOT: Record<string, string> = {
  critical: "var(--color-error)",
  high: "var(--color-pending)",
  normal: "var(--color-pending)",
  info: "var(--color-primary)",
};

const PIPELINE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  assuring: "Assuring",
  approved: "Approved",
  allocated: "Allocated",
  executing: "Executing",
  published: "Published",
  rejected: "Rejected",
  closed: "Closed",
};

function formatDays(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)}d`;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-medium text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}

/** OP-001 Operations Dashboard (Locked v1.1). See lib/ops-dashboard.ts's
 *  own header comment for how each row maps to real (mostly currently
 *  empty, honestly so) data rather than the fully-built OP-002/005/006
 *  workflows this depends on in the locked spec. */
export function OpsDashboard({ data }: { data: OpsDashboardData }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{data.todayLabel}</p>
        </div>
        <form action={opsSignOutAction}>
          <button type="submit" className="text-sm text-[var(--color-muted-foreground)] underline">
            Sign out
          </button>
        </form>
      </div>

      {/* Row 0 -- Today's Priorities */}
      <section>
        <SectionHeader title="Today's Priorities" />
        <Card className="mt-3 flex flex-col gap-2.5">
          {data.todaysPriorities.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Nothing needs attention today.</p>
          ) : (
            data.todaysPriorities.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm text-[var(--color-foreground)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: URGENCY_DOT[item.urgency] }}
                />
                {item.label}
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 1 -- Attention Required */}
      <section>
        <SectionHeader title="Attention Required" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.attentionRequired.map((card) => (
            <Card key={card.label} className="flex flex-col gap-1 p-4">
              <p className="text-xl font-semibold text-[var(--color-foreground)]">{card.count}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{card.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Row 2 -- Opportunity Overview + SLA */}
      <section>
        <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2.5">
          <h2 className="text-base font-medium">Opportunity Overview</h2>
          <div className="flex items-center gap-3">
            <Link href="/ops/opportunities" className="text-sm text-[var(--color-primary)]">
              View Opportunities
            </Link>
            <Link href="/ops/allocations" className="text-sm text-[var(--color-primary)]">
              Allocation Engine
            </Link>
            <Link href="/ops/executions" className="text-sm text-[var(--color-primary)]">
              Executions
            </Link>
            <Link href="/ops/documentation" className="text-sm text-[var(--color-primary)]">
              Documentation
            </Link>
            <Link href="/ops/publishing" className="text-sm text-[var(--color-primary)]">
              Publishing
            </Link>
            <Link href="/ops/partners" className="text-sm text-[var(--color-primary)]">
              Partners
            </Link>
            <Link href="/ops/contributors" className="text-sm text-[var(--color-primary)]">
              Contributors
            </Link>
          </div>
        </div>
        <Card className="mt-3 flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {Object.entries(PIPELINE_LABELS).map(([status, label]) => (
              <Stat key={status} label={label} value={data.pipeline[status as keyof typeof data.pipeline]} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
            <Stat label="Avg. verification (target <3d)" value={formatDays(data.sla.avgVerificationDays)} />
            <Stat label="Avg. allocation (target <2d)" value={formatDays(data.sla.avgAllocationDays)} />
            <Stat label="Avg. publication (target <5d)" value={formatDays(data.sla.avgPublicationDays)} />
          </div>
        </Card>
      </section>

      {/* Row 3 / 3.5 -- Active Executions + Execution Calendar */}
      <section>
        <SectionHeader title="Active Executions" />
        <Card className="mt-3 flex flex-col gap-3">
          {data.activeExecutions.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No active executions right now.</p>
          ) : (
            data.activeExecutions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{execution.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {execution.organization} · Owner: {execution.owner}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">{execution.scheduledDate}</p>
              </div>
            ))
          )}
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
            <Stat label="Today" value={data.executionCalendar.today} />
            <Stat label="Tomorrow" value={data.executionCalendar.tomorrow} />
            <Stat label="This week" value={data.executionCalendar.thisWeek} />
          </div>
        </Card>
      </section>

      {/* Row 4 -- Documentation Queue */}
      <section>
        <SectionHeader title="Documentation Queue" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Pending documentation" value={data.documentation.pendingDocumentation} />
          <Stat label="Pending review" value={data.documentation.pendingReview} />
          <Stat label="Missing evidence" value={data.documentation.missingEvidence} />
          <Stat label="Approved documentation" value={data.documentation.approvedDocumentation} />
        </Card>
      </section>

      {/* Row 5 -- Publishing Queue */}
      <section>
        <SectionHeader title="Publishing Queue" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Ready to publish" value={data.publishing.readyToPublish} />
          <Stat label="Awaiting review" value={data.publishing.awaitingReview} />
          <Stat label="Published this month" value={data.publishing.publishedThisMonth} />
          <Stat label="Avg. publish time" value={formatDays(data.publishing.avgPublishDays)} />
        </Card>
      </section>

      {/* Row 6 -- Contributor Snapshot */}
      <section>
        <SectionHeader title="Contributor Snapshot" />
        <Card className="mt-3 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Total contributors" value={data.contributorSnapshot.totalContributors} />
            <Stat label="Participated this month" value={data.contributorSnapshot.participatedThisMonth} />
            <Stat
              label="Avg. continuity"
              value={
                data.contributorSnapshot.avgContinuityMonths === null
                  ? "—"
                  : `${data.contributorSnapshot.avgContinuityMonths.toFixed(1)}mo`
              }
            />
            <Stat label="New this month" value={data.contributorSnapshot.newContributorsThisMonth} />
            <Stat label="At-risk contributors" value={data.contributorSnapshot.atRiskContributors} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--color-border)] pt-4">
            {STAGE_ORDER.map((stage) => (
              <Stat
                key={stage}
                label={STAGE_LABELS[stage].en}
                value={data.contributorSnapshot.stageDistribution[stage]}
              />
            ))}
          </div>
        </Card>
      </section>

      {/* Row 7 -- Partner Snapshot */}
      <section>
        <SectionHeader title="Partner Snapshot" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Verified partners" value={data.partnerSnapshot.verifiedPartners} />
          <Stat label="Active partners" value={data.partnerSnapshot.activePartners} />
          <Stat label="Pending verification" value={data.partnerSnapshot.pendingVerification} />
          <Stat label="Available capacity" value="—" />
        </Card>
      </section>

      {/* Row 8 -- System Health */}
      <section>
        <SectionHeader title="System Health" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Same-month execution rate" value={formatPercent(data.systemHealth.sameMonthExecutionRate)} />
          <Stat
            label="Documentation completion rate"
            value={formatPercent(data.systemHealth.documentationCompletionRate)}
          />
          <Stat
            label="Publication completion rate"
            value={formatPercent(data.systemHealth.publicationCompletionRate)}
          />
          <Stat
            label="Opportunity verification rate"
            value={formatPercent(data.systemHealth.opportunityVerificationRate)}
          />
        </Card>
      </section>

      <p className="text-center text-xs text-[var(--color-muted-foreground)]">
        Signed in as {data.operatorDisplayName} ·{" "}
        <Link href="/" className="underline">
          Contributor App
        </Link>
      </p>
    </div>
  );
}
