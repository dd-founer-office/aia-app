"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import {
  startReviewAction,
  updateEvidenceChecklistAction,
  approveDocumentationAction,
  returnForChangesAction,
  rejectDocumentationAction,
  bulkApproveDocumentationAction,
  exportDocumentationAction,
} from "@/lib/documentation-actions";
import type { DocumentationCenterData, DocumentationQueueItem, DocumentationReviewStatus, PublicationReadiness } from "@/lib/documentation";

const REVIEW_STATUS_BADGE: Record<DocumentationReviewStatus, { status: BadgeStatus; label: string }> = {
  submitted: { status: "pending", label: "Ready for review" },
  under_review: { status: "pending", label: "Under review" },
  approved: { status: "verified", label: "Approved" },
  returned_for_changes: { status: "error", label: "Returned for changes" },
  rejected: { status: "error", label: "Rejected" },
};

const READINESS_BADGE: Record<PublicationReadiness, { status: BadgeStatus; label: string }> = {
  ready_for_publishing: { status: "verified", label: "Ready for publishing" },
  needs_changes: { status: "pending", label: "Needs changes" },
  rejected: { status: "error", label: "Rejected" },
  pending: { status: "inactive", label: "Pending" },
};

const CAUSES = ["Education", "Medical", "Annadhanam", "Environment"];
const STATUSES: DocumentationReviewStatus[] = ["submitted", "under_review", "returned_for_changes", "rejected", "approved"];
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

function formatDays(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)}d`;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function selectClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "documentation-review.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ReviewPanel({ item, onDone }: { item: DocumentationQueueItem; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionMode, setDecisionMode] = useState<"return" | "reject" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  async function handleStartReview() {
    setPending(true);
    setError(null);
    const result = await startReviewAction(item.executionId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleSaveChecklist(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateEvidenceChecklistAction(item.executionId, new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleApprove() {
    setPending(true);
    setError(null);
    const result = await approveDocumentationAction(item.executionId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleDecisionSubmit() {
    if (!decisionNotes.trim()) {
      setError("Notes are required.");
      return;
    }
    setPending(true);
    setError(null);
    const result =
      decisionMode === "return"
        ? await returnForChangesAction(item.executionId, decisionNotes)
        : await rejectDocumentationAction(item.executionId, decisionNotes);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Row 3 -- Documentation Review Panel */}
      <section>
        <SectionHeader title="Documentation Review Panel" />
        <Card className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Outcome summary</p>
              <p>{item.outcomeSummary ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Beneficiary count</p>
              <p>{item.actualBeneficiaries ?? "—"} (estimate {item.beneficiaryEstimate ?? "—"})</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Completion notes</p>
              <p>{item.completionNotes ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Evidence</p>
              <p>{item.evidenceCount} file(s) · {item.supportingDocumentsCount} supporting document(s)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
            {item.reviewStatus === "submitted" && (
              <Button variant="secondary" disabled={pending} onClick={handleStartReview}>
                Start review
              </Button>
            )}
            <Button disabled={pending || !item.canApprove} onClick={handleApprove}>
              Approve
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setDecisionMode("return")}>
              Return for changes
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setDecisionMode("reject")}>
              Reject
            </Button>
          </div>
          {decisionMode && (
            <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
              <label className="flex flex-col gap-1 text-xs">
                Notes ({decisionMode === "return" ? "required to return" : "required to reject"})
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  rows={2}
                  className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                />
              </label>
              <div className="flex gap-2">
                <Button disabled={pending} onClick={handleDecisionSubmit}>
                  Confirm {decisionMode === "return" ? "return" : "reject"}
                </Button>
                <Button variant="text" onClick={() => { setDecisionMode(null); setDecisionNotes(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Row 4 -- Evidence Review + Row 5 -- Review Notes (combined save) */}
      <form onSubmit={handleSaveChecklist}>
        <section>
          <SectionHeader title="Evidence Review" />
          <Card className="mt-3 flex flex-col gap-4">
            {(["before_photo", "after_photo", "execution_photo", "video", "supporting_document"] as const).map((category) => {
              const files = item.evidence.filter((f) => f.category === category);
              return (
                <div key={category} className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                  <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    {category.replace(/_/g, " ")} ({files.length})
                  </p>
                  {files.length === 0 ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">None uploaded.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {files.map((f) => (
                        <a key={f.id} href={f.url ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] underline">
                          {f.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="evidence_clear" defaultChecked={item.checklist.evidenceClear} /> Clear evidence
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="evidence_relevant" defaultChecked={item.checklist.evidenceRelevant} /> Relevant evidence
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="evidence_complete" defaultChecked={item.checklist.evidenceComplete} /> Complete evidence
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="outcome_verified" defaultChecked={item.checklist.outcomeVerified} /> Outcome verified
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="beneficiary_count_reasonable" defaultChecked={item.checklist.beneficiaryCountReasonable} /> Beneficiary count reasonable
              </label>
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <SectionHeader title="Review Notes" />
          <Card className="mt-3 flex flex-col gap-3">
            <textarea
              name="review_notes"
              defaultValue={item.reviewNotes ?? ""}
              rows={3}
              placeholder="Review comments, correction requests, improvement suggestions…"
              className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Saving…" : "Save checklist & notes"}
            </Button>
          </Card>
        </section>
      </form>

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

      {/* Row 6 -- Publication Readiness */}
      <section>
        <SectionHeader title="Publication Readiness" />
        <Card className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {item.readiness === "ready_for_publishing"
              ? "Only Ready for publishing may proceed to Publishing (OP-007)."
              : "This documentation isn't eligible for publication yet."}
          </p>
          <Badge {...READINESS_BADGE[item.readiness]} />
        </Card>
      </section>

      {/* Row 8 -- Review Timeline */}
      <section>
        <SectionHeader title="Review Timeline" />
        <Card className="mt-3 flex flex-col gap-3">
          {item.timeline.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No review activity recorded yet.</p>
          ) : (
            item.timeline.map((entry, i) => (
              <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <span>{entry.label}</span>
                <span className="text-xs text-[var(--color-muted-foreground)]">{formatDate(entry.dateIso)}</span>
              </div>
            ))
          )}
        </Card>
      </section>
    </div>
  );
}

/** OP-006 Documentation Center (Locked v1.0). No OP-006A companion spec
 *  exists -- unlike OP-005/OP-005A, the locked Desktop Layout puts the
 *  queue table and the per-item Review Panel/Evidence Review/Notes/
 *  Readiness/Timeline rows on one page, so selecting a row here drives
 *  everything below it rather than navigating to a separate screen. */
export function DocumentationCenterClient({ data }: { data: DocumentationCenterData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [causeFilter, setCauseFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [reviewerFilter, setReviewerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.items.filter((i) => {
      if (causeFilter !== "All" && i.cause !== causeFilter) return false;
      if (districtFilter !== "All" && i.district !== districtFilter) return false;
      if (reviewerFilter !== "All" && i.reviewedByName !== reviewerFilter) return false;
      if (statusFilter !== "All" && i.reviewStatus !== statusFilter) return false;
      if (priorityFilter !== "All" && i.priority !== priorityFilter) return false;
      if (
        q &&
        !(
          i.executionId.toLowerCase().includes(q) ||
          i.opportunityTitle.toLowerCase().includes(q) ||
          (i.district ?? "").toLowerCase().includes(q) ||
          (i.submittedByName ?? "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [data.items, search, causeFilter, districtFilter, reviewerFilter, statusFilter, priorityFilter]);

  const selectedItem = data.items.find((i) => i.executionId === selectedId) ?? null;

  async function handleExport() {
    setExportPending(true);
    setExportError(null);
    const result = await exportDocumentationAction();
    setExportPending(false);
    if (result.error) {
      setExportError(result.error);
      return;
    }
    if (result.csv) downloadCsv(result.csv);
  }

  async function handleBulkApprove() {
    setBulkPending(true);
    setBulkMessage(null);
    const result = await bulkApproveDocumentationAction(Array.from(bulkSelected));
    setBulkPending(false);
    if (result.error) {
      setBulkMessage(result.error);
      return;
    }
    setBulkMessage(
      `Approved ${result.approvedCount}. ${result.skipped && result.skipped.length > 0 ? `${result.skipped.length} skipped (checklist incomplete).` : ""}`
    );
    setBulkSelected(new Set());
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
          ← Dashboard
        </Link>
        <Link href="/ops/executions" className="text-sm text-[var(--color-muted-foreground)] underline">
          Executions
        </Link>
        <Link href="/ops/publishing" className="text-sm text-[var(--color-muted-foreground)] underline">
          Publishing
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          Documentation Center
        </h1>
        <Card className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Pending reviews" value={data.pendingReviews} />
          <Stat label="Approved" value={data.approvedDocumentation} />
          <Stat label="Rejected" value={data.rejectedDocumentation} />
          <Stat label="Avg. review time" value={formatDays(data.avgReviewTimeDays)} />
        </Card>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setBulkMode((v) => !v)}>
            {bulkMode ? "Exit bulk review" : "Bulk review"}
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={exportPending}>
            {exportPending ? "Exporting…" : "Export"}
          </Button>
        </div>
        {bulkMode && (
          <div className="mt-2 flex items-center gap-2">
            <Button disabled={bulkPending || bulkSelected.size === 0} onClick={handleBulkApprove}>
              {bulkPending ? "Approving…" : `Approve ${bulkSelected.size} selected`}
            </Button>
            {bulkMessage && <p className="text-sm text-[var(--color-muted-foreground)]">{bulkMessage}</p>}
          </div>
        )}
      </div>

      {/* Row 1 -- Documentation Queue */}
      <section>
        <SectionHeader title="Documentation Queue" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Ready for review" value={data.queueCounts.readyForReview} />
          <Stat label="Under review" value={data.queueCounts.underReview} />
          <Stat label="Approved" value={data.queueCounts.approved} />
          <Stat label="Rejected" value={data.queueCounts.rejected} />
          <Stat label="Returned for changes" value={data.queueCounts.returnedForChanges} />
        </Card>
      </section>

      {/* Row 2 -- Documentation Review Table */}
      <section>
        <SectionHeader title="Documentation Review" />
        <Card className="mt-3 flex flex-col gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by execution ID, opportunity, district, submitter…"
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
            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass()}>
              <option value="All">All districts</option>
              {data.districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={reviewerFilter} onChange={(e) => setReviewerFilter(e.target.value)} className={selectClass()}>
              <option value="All">All reviewers</option>
              {data.reviewers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass()}>
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REVIEW_STATUS_BADGE[s].label}
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
            <p className="text-sm text-[var(--color-muted-foreground)]">No documentation matches these filters.</p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.executionId}
                className={`flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0 ${selectedId === item.executionId ? "opacity-100" : ""}`}
              >
                <div className="flex items-center gap-2">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(item.executionId)}
                      onChange={(e) => {
                        const next = new Set(bulkSelected);
                        if (e.target.checked) next.add(item.executionId);
                        else next.delete(item.executionId);
                        setBulkSelected(next);
                      }}
                    />
                  )}
                  <div>
                    <button
                      type="button"
                      className="font-medium text-[var(--color-primary)] underline"
                      onClick={() => setSelectedId(item.executionId)}
                    >
                      {item.opportunityTitle}
                    </button>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {item.executionId.slice(0, 8)} · {item.cause} · {item.district ?? "—"} · {item.submittedByName ?? "Unknown"} · {item.priority}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge {...REVIEW_STATUS_BADGE[item.reviewStatus]} />
                  <p className="text-xs text-[var(--color-muted-foreground)]">{formatDate(item.submittedAtIso)}</p>
                </div>
              </div>
            ))
          )}
        </Card>
        {exportError && <p className="mt-2 text-sm text-[var(--color-error)]">{exportError}</p>}
      </section>

      {selectedItem && <ReviewPanel key={selectedItem.executionId} item={selectedItem} onDone={() => setSelectedId(null)} />}

      {/* Row 7 -- Documentation Quality Metrics */}
      <section>
        <SectionHeader title="Documentation Quality Metrics" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Approval rate" value={formatPercent(data.qualityMetrics.approvalRate)} />
          <Stat label="Return rate" value={formatPercent(data.qualityMetrics.returnRate)} />
          <Stat label="Avg. review time" value={formatDays(data.qualityMetrics.avgReviewTimeDays)} />
          <Stat label="Missing evidence rate" value={formatPercent(data.qualityMetrics.missingEvidenceRate)} />
        </Card>
      </section>
    </div>
  );
}
