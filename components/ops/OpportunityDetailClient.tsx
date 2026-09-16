"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import {
  approveOpportunityAction,
  rejectOpportunityAction,
  requestInformationAction,
  allocateOpportunityAction,
  updateImpactAssuranceAction,
} from "@/lib/opportunity-actions";
import type { OpportunityDetail } from "@/lib/opportunity-detail";

const READINESS_BADGE: Record<OpportunityDetail["readiness"], { status: BadgeStatus; label: string }> = {
  ready: { status: "verified", label: "Ready" },
  needs_review: { status: "pending", label: "Needs review" },
  blocked: { status: "error", label: "Blocked" },
};

const PARTNER_STATUS_BADGE: Record<string, { status: BadgeStatus; label: string }> = {
  pending: { status: "pending", label: "Pending" },
  verified: { status: "verified", label: "Verified" },
  rejected: { status: "error", label: "Rejected" },
  suspended: { status: "error", label: "Suspended" },
};

const CHECKLIST_ITEMS: { key: keyof OpportunityDetail["checklist"]; name: string; label: string }[] = [
  { key: "opportunityVerified", name: "opportunity_verified", label: "Opportunity verified" },
  { key: "partnerVerified", name: "partner_verified", label: "Partner verified" },
  { key: "documentationComplete", name: "documentation_complete", label: "Documentation complete" },
  { key: "siteValidationComplete", name: "site_validation_complete", label: "Site validation complete" },
  {
    key: "executionFeasibilityConfirmed",
    name: "execution_feasibility_confirmed",
    label: "Execution feasibility confirmed",
  },
  { key: "riskAssessmentComplete", name: "risk_assessment_complete", label: "Risk assessment complete" },
];

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OpportunityDetailClient({ opportunity }: { opportunity: OpportunityDetail }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [showRequestInfo, setShowRequestInfo] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestNotes, setRequestNotes] = useState(opportunity.informationRequestNotes ?? "");

  const isTerminal = opportunity.status === "rejected" || opportunity.status === "closed";
  const readiness = READINESS_BADGE[opportunity.readiness];

  async function handleAssuranceSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending("assurance");
    setError(null);
    const result = await updateImpactAssuranceAction(opportunity.id, new FormData(e.currentTarget));
    setPending(null);
    if (result.error) setError(result.error);
  }

  async function handleApprove() {
    setPending("approve");
    setError(null);
    const result = await approveOpportunityAction(opportunity.id);
    setPending(null);
    if (result.error) setError(result.error);
  }

  async function handleAllocate() {
    setPending("allocate");
    setError(null);
    const result = await allocateOpportunityAction(opportunity.id);
    setPending(null);
    if (result.error) setError(result.error);
  }

  async function handleReject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending("reject");
    setError(null);
    const result = await rejectOpportunityAction(opportunity.id, rejectReason);
    setPending(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowReject(false);
  }

  async function handleRequestInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending("request-info");
    setError(null);
    const result = await requestInformationAction(opportunity.id, requestNotes);
    setPending(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowRequestInfo(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-8">
      <Link href="/ops/opportunities" className="text-sm text-[var(--color-muted-foreground)] underline">
        ← Opportunities
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {opportunity.id.slice(0, 8)}
          </span>
          <span className="capitalize text-xs text-[var(--color-muted-foreground)]">{opportunity.status}</span>
          <span className="capitalize text-xs text-[var(--color-muted-foreground)]">
            {opportunity.priority} priority
          </span>
        </div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          {opportunity.title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {opportunity.cause} · {opportunity.district ?? "No district"}
        </p>

        {!isTerminal && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleApprove} disabled={!opportunity.canApprove || pending !== null}>
              {pending === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button variant="secondary" onClick={() => setShowReject((v) => !v)} disabled={pending !== null}>
              Reject
            </Button>
            <Button variant="secondary" onClick={() => setShowRequestInfo((v) => !v)} disabled={pending !== null}>
              Request information
            </Button>
            {opportunity.canAllocate && (
              <Button onClick={handleAllocate} disabled={pending !== null}>
                {pending === "allocate" ? "Allocating…" : "Allocate"}
              </Button>
            )}
          </div>
        )}

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        {showReject && (
          <Card>
            <form onSubmit={handleReject} className="flex flex-col gap-2">
              <label htmlFor="reject_reason" className="text-sm font-medium text-[var(--color-foreground)]">
                Rejection reason
              </label>
              <textarea
                id="reject_reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                className={inputClass()}
                required
              />
              <Button type="submit" variant="secondary" disabled={pending === "reject"} className="self-start">
                {pending === "reject" ? "Rejecting…" : "Confirm Reject"}
              </Button>
            </form>
          </Card>
        )}

        {showRequestInfo && (
          <Card>
            <form onSubmit={handleRequestInfo} className="flex flex-col gap-2">
              <label htmlFor="request_notes" className="text-sm font-medium text-[var(--color-foreground)]">
                What information is needed?
              </label>
              <textarea
                id="request_notes"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                rows={2}
                className={inputClass()}
                required
              />
              <Button type="submit" variant="secondary" disabled={pending === "request-info"} className="self-start">
                {pending === "request-info" ? "Saving…" : "Save Request"}
              </Button>
            </form>
          </Card>
        )}

        {opportunity.rejectionReason && (
          <Card>
            <p className="text-xs text-[var(--color-muted-foreground)]">Rejection reason</p>
            <p className="mt-1 text-sm text-[var(--color-foreground)]">{opportunity.rejectionReason}</p>
          </Card>
        )}
      </div>

      {/* Section 1 -- Opportunity Summary */}
      <section>
        <SectionHeader title="Opportunity Summary" />
        <Card className="mt-3 flex flex-col gap-2 text-sm">
          {opportunity.needSummary && <p className="text-[var(--color-foreground)]">{opportunity.needSummary}</p>}
          <dl className="grid grid-cols-2 gap-y-2">
            <dt className="text-[var(--color-muted-foreground)]">Beneficiary estimate</dt>
            <dd className="text-right">{opportunity.beneficiaryEstimate ?? "—"}</dd>
            <dt className="text-[var(--color-muted-foreground)]">Created</dt>
            <dd className="text-right">{formatDate(opportunity.createdAtIso)}</dd>
            <dt className="text-[var(--color-muted-foreground)]">Target execution</dt>
            <dd className="text-right">{formatDate(opportunity.targetExecutionDate)}</dd>
            <dt className="text-[var(--color-muted-foreground)]">Source</dt>
            <dd className="text-right capitalize">{opportunity.source.replace(/_/g, " ")}</dd>
          </dl>
        </Card>
      </section>

      {/* Section 2/5/6 -- Impact Assurance, Execution Readiness, Risk Assessment, Documentation notes */}
      <section>
        <SectionHeader title="Impact Assurance Checklist" />
        <Card className="mt-3">
          <form onSubmit={handleAssuranceSave} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              {CHECKLIST_ITEMS.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                  <input
                    type="checkbox"
                    name={item.name}
                    defaultChecked={opportunity.checklist[item.key]}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-4">
              <label htmlFor="execution_owner" className="text-sm font-medium text-[var(--color-foreground)]">
                Execution owner
              </label>
              <input
                id="execution_owner"
                name="execution_owner"
                defaultValue={opportunity.executionOwner ?? ""}
                className={inputClass()}
                placeholder="Who owns execution?"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
              <p className="text-sm font-medium text-[var(--color-foreground)]">Risk Assessment</p>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="risk_level" className="text-xs text-[var(--color-muted-foreground)]">
                  Risk level
                </label>
                <select
                  id="risk_level"
                  name="risk_level"
                  defaultValue={opportunity.riskLevel}
                  className={inputClass()}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical (blocks approval)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="risk_notes" className="text-xs text-[var(--color-muted-foreground)]">
                  Risk notes
                </label>
                <textarea
                  id="risk_notes"
                  name="risk_notes"
                  rows={2}
                  defaultValue={opportunity.riskNotes ?? ""}
                  className={inputClass()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mitigation_plan" className="text-xs text-[var(--color-muted-foreground)]">
                  Mitigation plan
                </label>
                <textarea
                  id="mitigation_plan"
                  name="mitigation_plan"
                  rows={2}
                  defaultValue={opportunity.mitigationPlan ?? ""}
                  className={inputClass()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="risk_owner" className="text-xs text-[var(--color-muted-foreground)]">
                  Risk owner
                </label>
                <input
                  id="risk_owner"
                  name="risk_owner"
                  defaultValue={opportunity.riskOwner ?? ""}
                  className={inputClass()}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-4">
              <label htmlFor="documentation_notes" className="text-sm font-medium text-[var(--color-foreground)]">
                Documentation notes
              </label>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                No documents have been submitted for this opportunity yet.
              </p>
              <textarea
                id="documentation_notes"
                name="documentation_notes"
                rows={2}
                defaultValue={opportunity.documentationNotes ?? ""}
                className={inputClass()}
              />
            </div>

            <Button type="submit" disabled={pending === "assurance"} className="self-start">
              {pending === "assurance" ? "Saving…" : "Save"}
            </Button>
          </form>
        </Card>
      </section>

      {/* Section 4 -- Partner Validation */}
      <section>
        <SectionHeader title="Partner Validation" />
        <Card className="mt-3">
          {opportunity.partner ? (
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--color-muted-foreground)]">Partner</dt>
              <dd className="text-right">{opportunity.partner.name}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Type</dt>
              <dd className="text-right">{opportunity.partner.partnerType ?? "—"}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Status</dt>
              <dd className="text-right">
                <Badge
                  status={PARTNER_STATUS_BADGE[opportunity.partner.status].status}
                  label={PARTNER_STATUS_BADGE[opportunity.partner.status].label}
                />
              </dd>
              <dt className="text-[var(--color-muted-foreground)]">Last verified</dt>
              <dd className="text-right">{formatDate(opportunity.partner.verifiedAtIso)}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Past executions</dt>
              <dd className="text-right">{opportunity.partner.pastExecutionsCount}</dd>
              <dt className="text-[var(--color-muted-foreground)]">Current capacity</dt>
              <dd className="text-right">—</dd>
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">No partner linked to this opportunity yet.</p>
          )}
        </Card>
      </section>

      {/* Section 8 -- Allocation Readiness */}
      <section>
        <SectionHeader title="Allocation Readiness" />
        <Card className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Ready for allocation requires all checklist items complete and no critical risk.
          </p>
          <Badge status={readiness.status} label={readiness.label} />
        </Card>
      </section>

      {/* Section 7 -- Activity Timeline */}
      <section>
        <SectionHeader title="Activity Timeline" />
        <Card className="mt-3 divide-y divide-[var(--color-border)] p-0">
          {opportunity.timeline.map((event) => (
            <div key={event.label} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-[var(--color-foreground)]">{event.label}</span>
              <span className="text-[var(--color-muted-foreground)]">{formatDate(event.dateIso)}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
