"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import {
  createExecutionAction,
  updateExecutionAssignmentAction,
  startExecutionAction,
  completeExecutionAction,
  delayExecutionAction,
  blockExecutionAction,
  cancelExecutionAction,
  exportExecutionsAction,
} from "@/lib/execution-actions";
import type { ExecutionManagementData, ExecutionRow, ExecutionStatus } from "@/lib/execution";
import type { CapacityStatus } from "@/lib/allocation";

const STATUS_BADGE: Record<ExecutionStatus, { status: BadgeStatus; label: string }> = {
  allocated: { status: "inactive", label: "Allocated" },
  scheduled: { status: "pending", label: "Scheduled" },
  in_progress: { status: "pending", label: "In progress" },
  completed: { status: "verified", label: "Completed" },
  delayed: { status: "error", label: "Delayed" },
  blocked: { status: "error", label: "Blocked" },
  cancelled: { status: "inactive", label: "Cancelled" },
};

const AVAILABILITY_BADGE: Record<CapacityStatus, { status: BadgeStatus; label: string }> = {
  healthy: { status: "verified", label: "Available" },
  limited: { status: "pending", label: "Limited" },
  at_risk: { status: "error", label: "Unavailable" },
  unknown: { status: "inactive", label: "Unknown" },
};

const RISK_BADGE: Record<string, { status: BadgeStatus; label: string }> = {
  low: { status: "verified", label: "Low" },
  medium: { status: "pending", label: "Medium" },
  high: { status: "error", label: "High" },
  critical: { status: "error", label: "Critical" },
};

const CAUSES = ["Education", "Medical", "Annadhanam", "Environment"];
const STATUSES: ExecutionStatus[] = ["allocated", "scheduled", "in_progress", "completed", "delayed", "blocked", "cancelled"];
const PRIORITIES = ["critical", "high", "normal", "low"];

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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function selectClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function downloadCsv(csv: string, monthLabel: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `executions-${monthLabel.replace(" ", "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function ExecutionRowPanel({ execution, onDone }: { execution: ExecutionRow; onDone: () => void }) {
  const [owner, setOwner] = useState(execution.executionOwner ?? "");
  const [scheduledDate, setScheduledDate] = useState(execution.scheduledDate ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonMode, setReasonMode] = useState<"delay" | "block" | "cancel" | null>(null);
  const [reason, setReason] = useState("");

  async function handleSaveAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateExecutionAssignmentAction(execution.id, owner, scheduledDate);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function runAction(action: () => Promise<{ error?: string }>) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleReasonSubmit() {
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    if (reasonMode === "delay") await runAction(() => delayExecutionAction(execution.id, reason));
    if (reasonMode === "block") await runAction(() => blockExecutionAction(execution.id, reason));
    if (reasonMode === "cancel") await runAction(() => cancelExecutionAction(execution.id, reason));
  }

  return (
    <Card className="mt-2 flex flex-col gap-3 bg-[var(--color-background)]">
      <form onSubmit={handleSaveAssignment} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs">
          Execution owner
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Scheduled date
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <Button type="submit" variant="secondary" disabled={pending}>
          Save
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
        <Button variant="secondary" disabled={pending} onClick={() => runAction(() => startExecutionAction(execution.id))}>
          Start
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => runAction(() => completeExecutionAction(execution.id))}>
          Complete
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => setReasonMode("delay")}>
          Delay
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => setReasonMode("block")}>
          Block
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => setReasonMode("cancel")}>
          Cancel
        </Button>
      </div>

      {reasonMode && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
          <label className="flex flex-col gap-1 text-xs">
            Reason for {reasonMode}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </label>
          <div className="flex gap-2">
            <Button disabled={pending} onClick={handleReasonSubmit}>
              Confirm {reasonMode}
            </Button>
            <Button variant="text" onClick={() => { setReasonMode(null); setReason(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
    </Card>
  );
}

/** OP-005 Execution Management (Locked v1.0). See lib/execution.ts's own
 *  header comment for the documented simplifications -- most notably that
 *  Completion/Documentation Readiness states here are proxied from
 *  opportunities.documentation_notes since OP-006 Documentation Center
 *  doesn't exist yet. Each row's "Open" link goes to OP-005A (Execution
 *  Detail & Evidence Upload) for the real outcome-recording/evidence
 *  flow; the inline "Manage" panel here stays for quick status-only
 *  actions (Start/Complete/Delay/Block/Cancel) without leaving the list. */
export function ExecutionManagementClient({ data }: { data: ExecutionManagementData }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [createOpportunityId, setCreateOpportunityId] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [causeFilter, setCauseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [partnerFilter, setPartnerFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.executions.filter((e) => {
      if (causeFilter !== "All" && e.cause !== causeFilter) return false;
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      if (districtFilter !== "All" && e.district !== districtFilter) return false;
      if (partnerFilter !== "All" && e.partnerId !== partnerFilter) return false;
      if (ownerFilter !== "All" && e.executionOwner !== ownerFilter) return false;
      if (priorityFilter !== "All" && e.priority !== priorityFilter) return false;
      if (
        q &&
        !(
          e.id.toLowerCase().includes(q) ||
          e.opportunityTitle.toLowerCase().includes(q) ||
          (e.partnerName ?? "").toLowerCase().includes(q) ||
          (e.district ?? "").toLowerCase().includes(q) ||
          (e.executionOwner ?? "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [data.executions, search, causeFilter, statusFilter, districtFilter, partnerFilter, ownerFilter, priorityFilter]);

  async function handleCreateExecution(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!createOpportunityId) {
      setCreateError("Choose an opportunity first.");
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    const result = await createExecutionAction(createOpportunityId);
    setCreatePending(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setCreateOpportunityId("");
  }

  async function handleExport() {
    setExportPending(true);
    setExportError(null);
    const result = await exportExecutionsAction();
    setExportPending(false);
    if (result.error) {
      setExportError(result.error);
      return;
    }
    if (result.csv) downloadCsv(result.csv, data.currentMonthLabel);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
          ← Dashboard
        </Link>
        <Link href="/ops/opportunities" className="text-sm text-[var(--color-muted-foreground)] underline">
          Opportunities
        </Link>
        <Link href="/ops/allocations" className="text-sm text-[var(--color-muted-foreground)] underline">
          Allocation Engine
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          Execution Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{data.currentMonthLabel}</p>
        <Card className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Active executions" value={data.activeExecutions} />
          <Stat label="Completed this month" value={data.completedExecutionsThisMonth} />
          <Stat
            label="Compliance rate"
            value={data.complianceRate === null ? "—" : `${Math.round(data.complianceRate * 100)}%`}
          />
        </Card>

        <Card className="mt-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">Create execution</p>
          {data.opportunitiesMissingExecution.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Every allocated opportunity already has an execution -- this is a backfill path for gaps only.
            </p>
          ) : (
            <form onSubmit={handleCreateExecution} className="flex flex-wrap items-end gap-3">
              <select
                value={createOpportunityId}
                onChange={(e) => setCreateOpportunityId(e.target.value)}
                className={selectClass()}
              >
                <option value="">Select an opportunity…</option>
                {data.opportunitiesMissingExecution.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={createPending}>
                {createPending ? "Creating…" : "Create"}
              </Button>
            </form>
          )}
          {createError && <p className="text-sm text-[var(--color-error)]">{createError}</p>}
          <Button variant="secondary" onClick={handleExport} disabled={exportPending} className="self-start">
            {exportPending ? "Exporting…" : "Export"}
          </Button>
          {exportError && <p className="text-sm text-[var(--color-error)]">{exportError}</p>}
        </Card>
      </div>

      {/* Row 1 -- Execution Health Summary */}
      <section>
        <SectionHeader title="Execution Health Summary" />
        <Card className="mt-3 grid grid-cols-3 gap-4 sm:grid-cols-6">
          <Stat label="Scheduled" value={data.healthSummary.scheduled} />
          <Stat label="In progress" value={data.healthSummary.in_progress} />
          <Stat label="Completed" value={data.healthSummary.completed} />
          <Stat label="Delayed" value={data.healthSummary.delayed} />
          <Stat label="Blocked" value={data.healthSummary.blocked} />
          <Stat label="Cancelled" value={data.healthSummary.cancelled} />
        </Card>
      </section>

      {/* Row 2 -- Executions Requiring Attention */}
      <section>
        <SectionHeader title="Executions Requiring Attention" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.attentionRequired.map((item) => (
            <Card key={item.label} className="flex flex-col gap-1 p-4">
              <p className="text-xl font-semibold text-[var(--color-foreground)]">{item.count}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{item.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Row 3 -- Execution Table */}
      <section>
        <SectionHeader title="Executions" />
        <Card className="mt-3 flex flex-col gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by execution ID, opportunity, partner, district, owner…"
            className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <div className="flex flex-wrap gap-2">
            <select value={causeFilter} onChange={(e) => setCauseFilter(e.target.value)} className={selectClass()}>
              <option value="All">All causes</option>
              {CAUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass()}>
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_BADGE[s].label}
                </option>
              ))}
            </select>
            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass()}>
              <option value="All">All districts</option>
              {data.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} className={selectClass()}>
              <option value="All">All partners</option>
              {data.partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={selectClass()}>
              <option value="All">All owners</option>
              {data.owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectClass()}>
              <option value="All">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No executions match these filters.</p>
          ) : (
            filtered.map((e) => (
              <div key={e.id} className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <Link href={`/ops/opportunities/${e.opportunityId}`} className="font-medium text-[var(--color-primary)]">
                      {e.opportunityTitle}
                    </Link>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {e.id.slice(0, 8)} · {e.cause} · {e.district ?? "—"} · {e.partnerName ?? "No partner"} · {e.executionOwner ?? "Unassigned"} · {e.priority}
                    </p>
                    {e.delayReason && <p className="text-xs text-[var(--color-error)]">Delayed: {e.delayReason}</p>}
                    {e.blockReason && <p className="text-xs text-[var(--color-error)]">Blocked: {e.blockReason}</p>}
                    {e.cancellationReason && <p className="text-xs text-[var(--color-error)]">Cancelled: {e.cancellationReason}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge {...STATUS_BADGE[e.status]} />
                    <p className="text-xs text-[var(--color-muted-foreground)]">{formatDate(e.scheduledDate)}</p>
                    <div className="flex items-center gap-2">
                      <Link href={`/ops/executions/${e.id}`} className="text-xs text-[var(--color-primary)] underline">
                        Open
                      </Link>
                      <button
                        type="button"
                        className="text-xs text-[var(--color-primary)] underline"
                        onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                      >
                        {expandedId === e.id ? "Close" : "Manage"}
                      </button>
                    </div>
                  </div>
                </div>
                {expandedId === e.id && <ExecutionRowPanel execution={e} onDone={() => setExpandedId(null)} />}
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 4 -- Execution Scheduling Panel */}
      <section>
        <SectionHeader title="Execution Scheduling Panel" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Today" value={data.scheduling.today} />
          <Stat label="Tomorrow" value={data.scheduling.tomorrow} />
          <Stat label="This week" value={data.scheduling.thisWeek} />
          <Stat label="Upcoming" value={data.scheduling.upcoming} />
        </Card>
      </section>

      {/* Row 5 -- Ownership Panel */}
      <section>
        <SectionHeader title="Ownership Panel" />
        <Card className="mt-3 flex flex-col gap-2">
          {data.ownership.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No executions have an owner assigned yet.</p>
          ) : (
            data.ownership.map((o) => (
              <div key={o.owner} className="flex items-center justify-between text-sm">
                <span>{o.owner}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {o.assignedExecutions} assigned · {o.completedThisMonth} completed this month · {o.delayedExecutions} delayed
                </span>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 6 -- Partner Coordination */}
      <section>
        <SectionHeader title="Partner Coordination" />
        <Card className="mt-3 flex flex-col gap-2">
          {data.partnerCoordination.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No partners linked to active executions.</p>
          ) : (
            data.partnerCoordination.map((p) => (
              <div key={p.partnerId} className="flex items-center justify-between text-sm">
                <span>{p.partnerName}</span>
                <span className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                  {p.assignedExecutions} assigned · {p.currentCapacity ?? "—"} capacity
                  {p.issues.length > 0 ? ` · ${p.issues.join(", ")}` : ""}
                  <Badge {...AVAILABILITY_BADGE[p.availability]} />
                </span>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 7 -- Completion Tracking */}
      <section>
        <SectionHeader title="Completion Tracking" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Completed this month" value={data.completion.completedThisMonth} />
          <Stat label="Awaiting documentation" value={data.completion.awaitingDocumentation} />
          <Stat label="Documentation submitted" value={data.completion.documentationSubmitted} />
          <Stat label="Ready for review" value={data.completion.readyForReview} />
        </Card>
      </section>

      {/* Row 8 -- Execution Risks */}
      <section>
        <SectionHeader title="Execution Risks" />
        <Card className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Overall risk</p>
            <Badge {...RISK_BADGE[data.risk.overallRiskLevel]} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3 sm:grid-cols-3">
            <Stat label="Partner delays" value={data.risk.partnerDelays} />
            <Stat label="Documentation risks" value={data.risk.documentationRisks} />
            <Stat label="Scheduling risks" value={data.risk.schedulingRisks} />
            <Stat label="Capacity risks" value={data.risk.capacityRisks} />
            <Stat label="Weather / event risks" value={data.risk.weatherEventRisks} />
          </div>
        </Card>
      </section>

      {/* Row 9 -- Execution Timeline */}
      <section>
        <SectionHeader title="Execution Timeline" />
        <Card className="mt-3 flex flex-col gap-3">
          {data.timeline.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No execution activity recorded yet.</p>
          ) : (
            data.timeline.map((entry, i) => (
              <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <span>
                  {entry.label} · <span className="font-medium">{entry.opportunityTitle}</span>
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{formatDateTime(entry.dateIso)}</span>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Monthly Execution Compliance */}
      <section>
        <SectionHeader title="Monthly Execution Compliance" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Allocated" value={data.compliance.allocatedThisMonth} />
          <Stat label="Completed" value={data.compliance.completedThisMonth} />
          <Stat label="Delayed" value={data.compliance.delayed} />
          <Stat label="Cancelled" value={data.compliance.cancelled} />
          <Stat
            label="Compliance rate"
            value={data.compliance.complianceRate === null ? "—" : `${Math.round(data.compliance.complianceRate * 100)}%`}
          />
        </Card>
      </section>
    </div>
  );
}
