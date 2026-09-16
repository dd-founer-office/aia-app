"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import { runAllocationAction, createManualAllocationAction, exportAllocationsAction } from "@/lib/allocation-actions";
import type { AllocationEngineData, CapacityStatus, ConfidenceLevel } from "@/lib/allocation";
import type { RiskLevel } from "@/lib/opportunity-detail";

const READINESS_BADGE: Record<string, { status: BadgeStatus; label: string }> = {
  ready: { status: "verified", label: "Ready" },
  needs_review: { status: "pending", label: "Needs review" },
  blocked: { status: "error", label: "Blocked" },
};

const CAPACITY_BADGE: Record<CapacityStatus, { status: BadgeStatus; label: string }> = {
  healthy: { status: "verified", label: "Healthy" },
  limited: { status: "pending", label: "Limited" },
  at_risk: { status: "error", label: "At risk" },
  unknown: { status: "inactive", label: "Unknown" },
};

const CONFIDENCE_BADGE: Record<ConfidenceLevel, { status: BadgeStatus; label: string }> = {
  high: { status: "verified", label: "High" },
  medium: { status: "pending", label: "Medium" },
  low: { status: "error", label: "Low" },
};

const RISK_BADGE: Record<RiskLevel, { status: BadgeStatus; label: string }> = {
  low: { status: "verified", label: "Low" },
  medium: { status: "pending", label: "Medium" },
  high: { status: "error", label: "High" },
  critical: { status: "error", label: "Critical" },
};

const PARTNER_STATUS_BADGE: Record<string, { status: BadgeStatus; label: string }> = {
  verified: { status: "verified", label: "Verified" },
  pending: { status: "pending", label: "Pending" },
  rejected: { status: "error", label: "Rejected" },
  suspended: { status: "error", label: "Suspended" },
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-medium text-[var(--color-foreground)]">{value}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function downloadCsv(csv: string, monthLabel: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `allocation-engine-${monthLabel.replace(" ", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** OP-004 Allocation Engine (Locked v1.0). See lib/allocation.ts's own
 *  header comment for the two structural simplifications (district
 *  capacity derived from partners' opportunities, not a real district
 *  field; partner monthly_capacity is a brand-new, mostly-unset field). */
export function AllocationEngineClient({ data }: { data: AllocationEngineData }) {
  const [runPending, setRunPending] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>("");
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualReason, setManualReason] = useState("");
  const [manualPending, setManualPending] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  const readyOpportunities = useMemo(
    () => data.allocationReadyOpportunities.filter((o) => o.readiness === "ready"),
    [data.allocationReadyOpportunities]
  );
  const selectedOpportunity = readyOpportunities.find((o) => o.id === selectedOpportunityId) ?? null;
  const selectedRecommendation = data.recommendations.find((r) => r.opportunityId === selectedOpportunityId) ?? null;
  const selectedAvailable = selectedOpportunity
    ? (data.monthlyParticipation.byCause.find((c) => c.cause === selectedOpportunity.cause)?.available ?? 0)
    : 0;

  async function handleRunAllocation() {
    setRunPending(true);
    setRunError(null);
    setRunMessage(null);
    const result = await runAllocationAction();
    setRunPending(false);
    if (result.error) {
      setRunError(result.error);
      return;
    }
    setRunMessage(`Allocated ${result.allocatedCount} opportunit${result.allocatedCount === 1 ? "y" : "ies"}.`);
  }

  async function handleExport() {
    setExportPending(true);
    setExportError(null);
    const result = await exportAllocationsAction();
    setExportPending(false);
    if (result.error) {
      setExportError(result.error);
      return;
    }
    if (result.csv) downloadCsv(result.csv, data.currentMonthLabel);
  }

  function selectForManualAllocation(opportunityId: string, recommended: number | null) {
    setSelectedOpportunityId(opportunityId);
    setManualAmount(recommended !== null ? String(recommended) : "");
    setManualReason("");
    setManualError(null);
    setManualMessage(null);
  }

  async function handleManualAllocate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedOpportunityId) {
      setManualError("Choose an opportunity first.");
      return;
    }
    const amount = Number(manualAmount);
    setManualPending(true);
    setManualError(null);
    setManualMessage(null);
    const result = await createManualAllocationAction(selectedOpportunityId, amount, manualReason);
    setManualPending(false);
    if (result.error) {
      setManualError(result.error);
      return;
    }
    setManualMessage("Allocation recorded.");
    setSelectedOpportunityId("");
    setManualAmount("");
    setManualReason("");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
          ← Dashboard
        </Link>
        <Link href="/ops/opportunities" className="text-sm text-[var(--color-muted-foreground)] underline">
          Opportunities
        </Link>
        <Link href="/ops/executions" className="text-sm text-[var(--color-muted-foreground)] underline">
          Executions
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
              Allocation Engine
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{data.currentMonthLabel}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleRunAllocation} disabled={runPending}>
            {runPending ? "Running…" : "Run allocation"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => document.getElementById("manual-allocation-panel")?.scrollIntoView({ behavior: "smooth" })}
          >
            Manual allocation
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={exportPending}>
            {exportPending ? "Exporting…" : "Export"}
          </Button>
        </div>
        {runError && <p className="mt-2 text-sm text-[var(--color-error)]">{runError}</p>}
        {runMessage && <p className="mt-2 text-sm text-[var(--color-primary)]">{runMessage}</p>}
        {exportError && <p className="mt-2 text-sm text-[var(--color-error)]">{exportError}</p>}
        <Card className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Total participations" value={data.totalParticipationsThisMonth} />
          <Stat label="Approved opportunities" value={data.approvedOpportunitiesCount} />
          <Stat
            label="Allocation readiness"
            value={`${data.allocationReadinessSummary.ready} ready · ${data.allocationReadinessSummary.needs_review} review · ${data.allocationReadinessSummary.blocked} blocked`}
          />
        </Card>
      </div>

      {/* Row 1 -- Monthly Participation Summary */}
      <section>
        <SectionHeader title="Monthly Participation Summary" />
        <Card className="mt-3 flex flex-col gap-3">
          <Stat label="Total participations" value={data.monthlyParticipation.total} />
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3 sm:grid-cols-4">
            {data.monthlyParticipation.byCause.map((c) => (
              <div key={c.cause}>
                <p className="text-lg font-medium text-[var(--color-foreground)]">{c.available}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {c.cause} available ({c.total} total, {c.allocatedThisMonth} allocated)
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Row 2 -- Allocation-Ready Opportunities */}
      <section>
        <SectionHeader title="Allocation-Ready Opportunities" />
        <Card className="mt-3 flex flex-col gap-3">
          {data.allocationReadyOpportunities.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No approved opportunities awaiting allocation.</p>
          ) : (
            data.allocationReadyOpportunities.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{o.title}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {o.cause} · {o.district ?? "—"} · {o.partnerName ?? "No partner"} · {o.beneficiaryEstimate ?? "—"} beneficiaries · {o.priority}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge {...READINESS_BADGE[o.readiness]} />
                  <p className="text-xs text-[var(--color-muted-foreground)]">{formatDate(o.targetExecutionDate)}</p>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 3 -- Allocation Recommendation Engine */}
      <section>
        <SectionHeader title="Allocation Recommendation Engine" />
        <Card className="mt-3 flex flex-col gap-3">
          {data.recommendations.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No Ready opportunities to recommend allocations for.</p>
          ) : (
            data.recommendations.map((r) => (
              <div key={r.opportunityId} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{r.opportunityTitle}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {r.recommendedAllocation === null ? "No beneficiary estimate set" : `${r.recommendedAllocation} participations`} · {r.priority} priority
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge {...CAPACITY_BADGE[r.executionCapacitySignal]} />
                  <Badge {...CONFIDENCE_BADGE[r.confidence]} />
                  <button
                    type="button"
                    className="text-xs text-[var(--color-primary)] underline"
                    onClick={() => selectForManualAllocation(r.opportunityId, r.recommendedAllocation)}
                  >
                    Use
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 4 -- Manual Allocation Panel */}
      <section id="manual-allocation-panel">
        <SectionHeader title="Manual Allocation Panel" />
        <Card className="mt-3">
          <form onSubmit={handleManualAllocate} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Opportunity
              <select
                value={selectedOpportunityId}
                onChange={(e) => {
                  const recommendation = data.recommendations.find((r) => r.opportunityId === e.target.value);
                  selectForManualAllocation(e.target.value, recommendation?.recommendedAllocation ?? null);
                }}
                className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">Select an opportunity…</option>
                {readyOpportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title} ({o.cause})
                  </option>
                ))}
              </select>
            </label>

            {selectedOpportunity && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {selectedAvailable} available for {selectedOpportunity.cause} this month · suggested{" "}
                {selectedRecommendation?.recommendedAllocation ?? "—"}
              </p>
            )}

            <label className="flex flex-col gap-1 text-sm">
              Allocation (participations)
              <input
                type="number"
                min={1}
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Reason (required if different from the recommendation)
              <textarea
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                rows={2}
                className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </label>

            {manualError && <p className="text-sm text-[var(--color-error)]">{manualError}</p>}
            {manualMessage && <p className="text-sm text-[var(--color-primary)]">{manualMessage}</p>}

            <Button type="submit" disabled={manualPending} className="self-start">
              {manualPending ? "Allocating…" : "Allocate"}
            </Button>
          </form>
        </Card>
      </section>

      {/* Row 5 -- Execution Capacity View */}
      <section>
        <SectionHeader title="Execution Capacity View" />
        <Card className="mt-3 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">Partner capacity</p>
            <div className="mt-2 flex flex-col gap-2">
              {data.partnerCapacities.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No partners linked to allocation-ready opportunities.</p>
              ) : (
                data.partnerCapacities.map((p) => (
                  <div key={p.partnerId} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {p.partnerName}
                      <Badge {...(PARTNER_STATUS_BADGE[p.partnerStatus] ?? PARTNER_STATUS_BADGE.pending)} />
                    </span>
                    <span className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                      {p.capacity ?? "—"} capacity · {p.allocatedThisMonth} allocated · {p.remaining ?? "—"} remaining
                      <Badge {...CAPACITY_BADGE[p.status]} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-sm font-medium text-[var(--color-foreground)]">District capacity</p>
            <div className="mt-2 flex flex-col gap-2">
              {data.districtCapacities.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No districts in the allocation-ready pool.</p>
              ) : (
                data.districtCapacities.map((d) => (
                  <div key={d.district} className="flex items-center justify-between text-sm">
                    <span>{d.district}</span>
                    <span className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                      {d.knownCapacity ?? "—"} known capacity
                      {d.partnersWithUnknownCapacity > 0 ? ` (${d.partnersWithUnknownCapacity} unknown)` : ""} ·{" "}
                      {d.allocatedThisMonth} allocated
                      <Badge {...CAPACITY_BADGE[d.status]} />
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
            <Stat label="Known capacity" value={data.monthlyCapacityForecast.knownCapacity} />
            <Stat label="Unknown partners" value={data.monthlyCapacityForecast.unknownPartnerCount} />
            <Stat label="Remaining" value={data.monthlyCapacityForecast.remaining ?? "—"} />
          </div>
        </Card>
      </section>

      {/* Row 6 -- Allocation Risk Panel */}
      <section>
        <SectionHeader title="Allocation Risk Panel" />
        <Card className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Overall risk</p>
            <Badge {...RISK_BADGE[data.risk.overallRiskLevel]} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3 sm:grid-cols-3">
            <Stat label="Over-capacity partners" value={data.risk.overCapacityPartners.length} />
            <Stat label="Execution bottlenecks" value={data.risk.executionBottlenecks.length} />
            <Stat label="Documentation gaps" value={data.risk.documentationGaps} />
            <Stat label="District saturation" value={data.risk.districtSaturation.length} />
            <Stat label="Partner availability issues" value={data.risk.partnerAvailabilityIssues.length} />
          </div>
          {(data.risk.overCapacityPartners.length > 0 ||
            data.risk.executionBottlenecks.length > 0 ||
            data.risk.districtSaturation.length > 0 ||
            data.risk.partnerAvailabilityIssues.length > 0) && (
            <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted-foreground)]">
              {data.risk.overCapacityPartners.map((p) => (
                <p key={p.partnerName}>{p.partnerName} is over capacity by {p.overBy}.</p>
              ))}
              {data.risk.executionBottlenecks.map((b) => (
                <p key={b.opportunityId}>{b.title} targets execution by {formatDate(b.targetExecutionDate)} and isn&apos;t allocated yet.</p>
              ))}
              {data.risk.districtSaturation.map((d) => (
                <p key={d.district}>{d.district} district is at capacity risk ({d.opportunityCount} pending opportunities).</p>
              ))}
              {data.risk.partnerAvailabilityIssues.map((p) => (
                <p key={p.partnerName}>{p.partnerName} is {p.status}, not verified.</p>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* Row 7 -- Allocation Timeline */}
      <section>
        <SectionHeader title="Allocation Timeline" />
        <Card className="mt-3 flex flex-col gap-3">
          {data.timeline.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No allocations recorded this month yet.</p>
          ) : (
            data.timeline.map((entry, i) => (
              <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <span>
                  Allocated {entry.participationsAllocated} to <span className="font-medium">{entry.opportunityTitle}</span>
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{formatDate(entry.createdAtIso)}</span>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 8 -- Monthly Execution Compliance */}
      <section>
        <SectionHeader title="Monthly Execution Compliance" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Allocated" value={data.compliance.allocatedThisMonth} />
          <Stat label="Executing" value={data.compliance.executingThisMonth} />
          <Stat label="Completed" value={data.compliance.completedThisMonth} />
          <Stat label="Pending" value={data.compliance.pendingThisMonth} />
          <Stat label="Overdue" value={data.compliance.overdue} />
        </Card>
      </section>
    </div>
  );
}
