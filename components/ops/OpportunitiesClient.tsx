"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import { createOpportunityAction } from "@/lib/opportunity-actions";
import type { OpportunitiesOverview, OpportunityRow } from "@/lib/opportunities";

const CAUSES = ["Education", "Medical", "Annadhanam", "Environment"];
const STATUSES: OpportunityRow["status"][] = [
  "submitted",
  "assuring",
  "approved",
  "allocated",
  "executing",
  "published",
  "rejected",
  "closed",
];
const PRIORITIES: OpportunityRow["priority"][] = ["critical", "high", "normal", "low"];
const SOURCES: { value: OpportunityRow["source"]; label: string }[] = [
  { value: "contributor_suggestion", label: "Contributor suggestion" },
  { value: "partner_submission", label: "Partner submission" },
  { value: "field_verification", label: "Field verification" },
  { value: "community_referral", label: "Community referral" },
  { value: "operator_created", label: "Operator created" },
];

const READINESS_BADGE: Record<OpportunityRow["readiness"], { status: BadgeStatus; label: string }> = {
  ready: { status: "verified", label: "Ready" },
  needs_review: { status: "pending", label: "Needs review" },
  blocked: { status: "error", label: "Blocked" },
};

function selectClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OpportunitiesClient({ data }: { data: OpportunitiesOverview }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [causeFilter, setCauseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [partnerFilter, setPartnerFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.opportunities.filter((o) => {
      if (causeFilter !== "All" && o.cause !== causeFilter) return false;
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (districtFilter !== "All" && o.district !== districtFilter) return false;
      if (partnerFilter !== "All" && o.partnerId !== partnerFilter) return false;
      if (priorityFilter !== "All" && o.priority !== priorityFilter) return false;
      if (
        q &&
        !(
          o.id.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          (o.partnerName ?? "").toLowerCase().includes(q) ||
          (o.district ?? "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [data.opportunities, search, causeFilter, statusFilter, districtFilter, partnerFilter, priorityFilter]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const result = await createOpportunityAction(new FormData(e.currentTarget));
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setShowForm(false);
    e.currentTarget.reset();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
            Opportunity Management
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Intake, verification, and tracking for opportunities entering AiA.
          </p>
          <div className="mt-1 flex gap-3">
            <Link href="/ops/allocations" className="text-sm text-[var(--color-primary)]">
              Allocation Engine →
            </Link>
            <Link href="/ops/executions" className="text-sm text-[var(--color-primary)]">
              Executions →
            </Link>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New Opportunity"}</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-[var(--color-foreground)]">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className={selectClass()}
                placeholder="e.g. Winter school kit distribution"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cause" className="text-sm font-medium text-[var(--color-foreground)]">
                  Cause
                </label>
                <select id="cause" name="cause" required className={selectClass()} defaultValue="">
                  <option value="" disabled>
                    Select cause
                  </option>
                  {CAUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="district" className="text-sm font-medium text-[var(--color-foreground)]">
                  District
                </label>
                <input id="district" name="district" className={selectClass()} placeholder="e.g. Madurai" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="need_summary" className="text-sm font-medium text-[var(--color-foreground)]">
                Need summary
              </label>
              <textarea
                id="need_summary"
                name="need_summary"
                rows={2}
                className={selectClass()}
                placeholder="What does this opportunity address?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="beneficiary_estimate" className="text-sm font-medium text-[var(--color-foreground)]">
                  Beneficiary estimate
                </label>
                <input
                  id="beneficiary_estimate"
                  name="beneficiary_estimate"
                  type="number"
                  min={0}
                  step={1}
                  className={selectClass()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="partner_id" className="text-sm font-medium text-[var(--color-foreground)]">
                  Partner
                </label>
                <select id="partner_id" name="partner_id" className={selectClass()} defaultValue="">
                  <option value="">No partner yet</option>
                  {data.partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="priority" className="text-sm font-medium text-[var(--color-foreground)]">
                  Priority
                </label>
                <select id="priority" name="priority" className={selectClass()} defaultValue="normal">
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="source" className="text-sm font-medium text-[var(--color-foreground)]">
                  Source
                </label>
                <select id="source" name="source" className={selectClass()} defaultValue="operator_created">
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="target_execution_date" className="text-sm font-medium text-[var(--color-foreground)]">
                  Target execution
                </label>
                <input id="target_execution_date" name="target_execution_date" type="date" className={selectClass()} />
              </div>
            </div>

            {formError && <p className="text-sm text-[var(--color-error)]">{formError}</p>}

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Creating…" : "Create Opportunity"}
            </Button>
          </form>
        </Card>
      )}

      {/* Row 1 -- Opportunity Health Summary */}
      <section>
        <SectionHeader title="Opportunity Health Summary" />
        <Card className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          {STATUSES.map((status) => (
            <div key={status}>
              <p className="text-lg font-medium text-[var(--color-foreground)]">{data.healthSummary[status]}</p>
              <p className="text-xs capitalize text-[var(--color-muted-foreground)]">{status}</p>
            </div>
          ))}
        </Card>
      </section>

      {/* Row 2 -- Opportunities Requiring Action */}
      <section>
        <SectionHeader title="Opportunities Requiring Action" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Needs verification", count: data.actionRequired.needsVerification },
            { label: "Awaiting documents", count: data.actionRequired.awaitingDocuments },
            { label: "Ready for approval", count: data.actionRequired.readyForApproval },
            { label: "Ready for allocation", count: data.actionRequired.readyForAllocation },
            { label: "Overdue", count: data.actionRequired.overdue },
          ].map((card) => (
            <Card key={card.label} className="flex flex-col gap-1 p-4">
              <p className="text-xl font-semibold text-[var(--color-foreground)]">{card.count}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{card.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Filters + Search */}
      <section>
        <SectionHeader title="Opportunities" />
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, partner, district…"
            className={`flex-1 ${selectClass()}`}
          />
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
                {s}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={selectClass()}
          >
            <option value="All">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className={selectClass()}
          >
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
        </div>

        {/* Row 3 -- Opportunity Table */}
        <Card className="mt-3 overflow-x-auto p-0">
          {filtered.length === 0 ? (
            <p className="p-5 text-sm text-[var(--color-muted-foreground)]">
              {data.opportunities.length === 0
                ? "No active opportunities found."
                : "No opportunities match these filters."}
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Cause</th>
                  <th className="px-4 py-3 font-medium">District</th>
                  <th className="px-4 py-3 font-medium">Partner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Readiness</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Target execution</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                      <Link href={`/ops/opportunities/${o.id}`} className="hover:underline">
                        {o.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{o.cause}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{o.district ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{o.partnerName ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-[var(--color-muted-foreground)]">{o.status}</td>
                    <td className="px-4 py-3 capitalize text-[var(--color-muted-foreground)]">{o.priority}</td>
                    <td className="px-4 py-3">
                      <Badge status={READINESS_BADGE[o.readiness].status} label={READINESS_BADGE[o.readiness].label} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{formatDate(o.createdAtIso)}</td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {formatDate(o.targetExecutionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      {/* Monthly Execution Compliance */}
      <section>
        <SectionHeader title="Monthly Execution Compliance" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">
              {data.monthlyCompliance.currentMonthOpportunities}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Current month opportunities</p>
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">
              {data.monthlyCompliance.executedThisMonth}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Executed this month</p>
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">
              {data.monthlyCompliance.pendingThisMonth}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Pending this month</p>
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">{data.monthlyCompliance.overdue}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Overdue</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
