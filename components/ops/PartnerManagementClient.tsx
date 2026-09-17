"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import {
  createPartnerAction,
  verifyPartnerAction,
  rejectPartnerAction,
  requestPartnerInfoAction,
  suspendPartnerAction,
  reinstatePartnerAction,
  updateCapacityAction,
  updateVerificationNotesAction,
  exportPartnersAction,
} from "@/lib/partners-actions";
import type { PartnerType, PartnersData, PartnerRow, PartnerVerificationStatus } from "@/lib/partners";
import type { CapacityStatus } from "@/lib/allocation";

// Duplicated from lib/partners.ts's PARTNER_TYPES rather than imported --
// that file also exports the server-only getPartnersData() (which pulls
// in next/headers via getSupabaseServerClient), and importing any runtime
// value from it here would drag that whole chain into the client bundle.
// Same convention OpportunitiesClient.tsx/ExecutionManagementClient.tsx
// already use for their own small locked-enum constants.
const PARTNER_TYPES: PartnerType[] = [
  "School",
  "Hospital",
  "NGO",
  "Temple",
  "Community organization",
  "Environmental group",
  "Field volunteer network",
  "Other",
];

const STATUS_BADGE: Record<PartnerVerificationStatus, { status: BadgeStatus; label: string }> = {
  pending: { status: "pending", label: "Pending" },
  verified: { status: "verified", label: "Verified" },
  suspended: { status: "error", label: "Suspended" },
  rejected: { status: "error", label: "Rejected" },
};

const CAPACITY_BADGE: Record<CapacityStatus, { status: BadgeStatus; label: string }> = {
  healthy: { status: "verified", label: "Healthy" },
  limited: { status: "pending", label: "Limited" },
  at_risk: { status: "error", label: "At risk" },
  unknown: { status: "inactive", label: "Unknown" },
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

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

function selectClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]";
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "partners.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function PartnerDetailPanel({ partner, onDone }: { partner: PartnerRow; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionMode, setDecisionMode] = useState<"reject" | "request" | "suspend" | null>(null);
  const [decisionText, setDecisionText] = useState("");
  const [capacity, setCapacity] = useState(partner.monthlyCapacity?.toString() ?? "");
  const [notes, setNotes] = useState(partner.verificationNotes ?? "");

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

  async function handleDecisionSubmit() {
    if (!decisionText.trim()) {
      setError("This requires a reason or note.");
      return;
    }
    if (decisionMode === "reject") await runAction(() => rejectPartnerAction(partner.id, decisionText));
    if (decisionMode === "request") await runAction(() => requestPartnerInfoAction(partner.id, decisionText));
    if (decisionMode === "suspend") await runAction(() => suspendPartnerAction(partner.id, decisionText));
  }

  async function handleSaveCapacity(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = capacity.trim() === "" ? null : Number(capacity);
    await runAction(() => updateCapacityAction(partner.id, parsed));
  }

  async function handleSaveNotes(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await runAction(() => updateVerificationNotesAction(partner.id, notes));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Row 6 -- Partner Detail Preview */}
      <section>
        <SectionHeader title="Partner Detail" />
        <Card className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Organization</p>
              <p>{partner.name} · {partner.partnerType ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Verification status</p>
              <Badge {...STATUS_BADGE[partner.status]} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Capacity</p>
              <p>{partner.monthlyCapacity ?? "—"} ({partner.allocatedCapacity} allocated this month)</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Reliability score</p>
              <p>{formatPercent(partner.reliabilityScore)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Active opportunities</p>
              <p>{partner.activeOpportunitiesCount}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Past executions</p>
              <p>{partner.pastExecutionsCount} · last {formatDate(partner.lastExecutionDateIso)}</p>
            </div>
          </div>
          {partner.informationRequested && (
            <p className="text-sm text-[var(--color-error)]">Information requested: {partner.informationRequested}</p>
          )}
          {partner.rejectionReason && <p className="text-sm text-[var(--color-error)]">Recent issue: {partner.rejectionReason}</p>}

          <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
            {partner.status === "pending" && (
              <>
                <Button disabled={pending} onClick={() => runAction(() => verifyPartnerAction(partner.id))}>
                  Approve
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => setDecisionMode("reject")}>
                  Reject
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => setDecisionMode("request")}>
                  Request information
                </Button>
              </>
            )}
            {partner.status === "verified" && (
              <Button variant="secondary" disabled={pending} onClick={() => setDecisionMode("suspend")}>
                Suspend
              </Button>
            )}
            {partner.status === "suspended" && (
              <Button disabled={pending} onClick={() => runAction(() => reinstatePartnerAction(partner.id))}>
                Reinstate
              </Button>
            )}
          </div>

          {decisionMode && (
            <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
              <label className="flex flex-col gap-1 text-xs">
                {decisionMode === "reject" && "Rejection reason"}
                {decisionMode === "request" && "What information is needed"}
                {decisionMode === "suspend" && "Reason for suspension"}
                <textarea value={decisionText} onChange={(e) => setDecisionText(e.target.value)} rows={2} className={inputClass()} />
              </label>
              <div className="flex gap-2">
                <Button disabled={pending} onClick={handleDecisionSubmit}>
                  Confirm
                </Button>
                <Button variant="text" onClick={() => { setDecisionMode(null); setDecisionText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveCapacity} className="flex items-end gap-3 border-t border-[var(--color-border)] pt-3">
            <label className="flex flex-col gap-1 text-xs">
              Monthly capacity
              <input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputClass()} />
            </label>
            <Button type="submit" variant="secondary" disabled={pending}>
              Save capacity
            </Button>
          </form>

          <form onSubmit={handleSaveNotes} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
            <label className="flex flex-col gap-1 text-xs">
              Verification notes (what was reviewed -- there&apos;s no document upload yet)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass()} />
            </label>
            <Button type="submit" variant="secondary" disabled={pending} className="self-start">
              Save notes
            </Button>
          </form>

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </Card>
      </section>
    </div>
  );
}

/** OP-009 Partner Management (Locked v1.0). See lib/partners.ts's own
 *  header comment for the documented simplifications (no document-upload
 *  pipeline for verification, no fabricated trend lines in Row 8). */
export function PartnerManagementClient({ data }: { data: PartnersData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPending, setAddPending] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.partners.filter((p) => {
      if (typeFilter !== "All" && p.partnerType !== typeFilter) return false;
      if (districtFilter !== "All" && p.district !== districtFilter) return false;
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (q && !(p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.district ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data.partners, search, typeFilter, districtFilter, statusFilter]);

  const selectedPartner = data.partners.find((p) => p.id === selectedId) ?? null;

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddPending(true);
    setAddError(null);
    const result = await createPartnerAction(new FormData(e.currentTarget));
    setAddPending(false);
    if (result.error) {
      setAddError(result.error);
      return;
    }
    setShowAddForm(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleExport() {
    setExportPending(true);
    setExportError(null);
    const result = await exportPartnersAction();
    setExportPending(false);
    if (result.error) {
      setExportError(result.error);
      return;
    }
    if (result.csv) downloadCsv(result.csv);
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
        <Link href="/ops/contributors" className="text-sm text-[var(--color-muted-foreground)] underline">
          Contributors
        </Link>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
            Partner Management
          </h1>
          <Button onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? "Cancel" : "Add partner"}</Button>
        </div>
        <Card className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total partners" value={data.totalPartners} />
          <Stat label="Verified" value={data.verifiedPartners} />
          <Stat label="Active" value={data.activePartners} />
          <Stat label="Pending verification" value={data.pendingVerification} />
        </Card>

        {showAddForm && (
          <Card className="mt-4">
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Partner name
                <input name="name" required className={inputClass()} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Partner type
                <select name="partner_type" className={selectClass()}>
                  <option value="">—</option>
                  {PARTNER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                District
                <input name="district" className={inputClass()} />
              </label>
              {addError && <p className="text-sm text-[var(--color-error)]">{addError}</p>}
              <Button type="submit" disabled={addPending} className="self-start">
                {addPending ? "Adding…" : "Add partner"}
              </Button>
            </form>
          </Card>
        )}

        <Button variant="secondary" onClick={handleExport} disabled={exportPending} className="mt-3">
          {exportPending ? "Exporting…" : "Export"}
        </Button>
        {exportError && <p className="mt-2 text-sm text-[var(--color-error)]">{exportError}</p>}
      </div>

      {/* Row 1 -- Partner Health Overview */}
      <section>
        <SectionHeader title="Partner Health Overview" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Total" value={data.healthOverview.total} />
          <Stat label="Verified" value={data.healthOverview.verified} />
          <Stat label="Active" value={data.healthOverview.active} />
          <Stat label="Pending" value={data.healthOverview.pending} />
          <Stat label="Suspended" value={data.healthOverview.suspended} />
        </Card>
      </section>

      {/* Row 2 -- Partner Capacity Overview */}
      <section>
        <SectionHeader title="Partner Capacity Overview" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Available capacity" value={data.capacityOverview.availableCapacity} />
          <Stat label="Allocated capacity" value={data.capacityOverview.allocatedCapacity} />
          <Stat label="Remaining capacity" value={data.capacityOverview.remainingCapacity} />
          <Stat label="Utilization" value={formatPercent(data.capacityOverview.utilizationPct)} />
        </Card>
      </section>

      {/* Row 3 -- Partner Reliability Overview */}
      <section>
        <SectionHeader title="Partner Reliability Overview" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="On-time completion" value={formatPercent(data.reliabilityOverview.avgOnTimeCompletionRate)} />
          <Stat label="Documentation quality" value={formatPercent(data.reliabilityOverview.avgDocumentationQualityRate)} />
          <Stat label="Execution success" value={formatPercent(data.reliabilityOverview.avgExecutionSuccessRate)} />
          <Stat label="Avg. reliability score" value={formatPercent(data.reliabilityOverview.avgReliabilityScore)} />
        </Card>
      </section>

      {/* Row 4 -- Partner Table */}
      <section>
        <SectionHeader title="Partners" />
        <Card className="mt-3 flex flex-col gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, name, district…" className={inputClass()} />
          <div className="flex flex-wrap gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass()}>
              <option value="All">All types</option>
              {PARTNER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass()}>
              <option value="All">All statuses</option>
              {(Object.keys(STATUS_BADGE) as PartnerVerificationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_BADGE[s].label}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No partners match these filters.</p>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <div>
                  <button type="button" className="font-medium text-[var(--color-primary)] underline" onClick={() => setSelectedId(p.id)}>
                    {p.name}
                  </button>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {p.id.slice(0, 8)} · {p.partnerType ?? "—"} · {p.district ?? "—"} · {formatPercent(p.reliabilityScore)} reliability · {p.activeOpportunitiesCount} active
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge {...STATUS_BADGE[p.status]} />
                  <Badge {...CAPACITY_BADGE[p.capacityStatus]} />
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Row 5 -- Partner Verification Queue */}
      <section>
        <SectionHeader title="Partner Verification Queue" />
        <Card className="mt-3 flex flex-col gap-2">
          {data.verificationQueue.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Nothing pending verification.</p>
          ) : (
            data.verificationQueue.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <button type="button" className="text-[var(--color-primary)] underline" onClick={() => setSelectedId(p.id)}>
                  {p.name}
                </button>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {p.partnerType ?? "—"} · {p.verificationNotes ? "Notes on file" : "No notes yet"}
                </span>
              </div>
            ))
          )}
        </Card>
      </section>

      {selectedPartner && <PartnerDetailPanel key={selectedPartner.id} partner={selectedPartner} onDone={() => setSelectedId(null)} />}

      {/* Row 7 -- Capacity Risk Panel */}
      <section>
        <SectionHeader title="Capacity Risk Panel" />
        <Card className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">{data.riskPanel.overCapacityPartners.length}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Over-capacity partners</p>
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">{data.riskPanel.limitedCapacityPartners.length}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Limited-capacity partners (also covers upcoming risk)</p>
          </div>
          <div>
            <p className="text-lg font-medium text-[var(--color-foreground)]">{data.riskPanel.inactivePartners.length}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Inactive partners</p>
          </div>
        </Card>
      </section>

      {/* Row 8 -- Partner Performance Insights */}
      <section>
        <SectionHeader title="Partner Performance Insights" />
        <Card className="mt-3 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">Most reliable partner types</p>
            {data.insights.mostReliablePartnerTypes.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">No reliability data yet.</p>
            ) : (
              data.insights.mostReliablePartnerTypes.map((t) => (
                <p key={t.type} className="text-xs text-[var(--color-muted-foreground)]">
                  {t.type}: {formatPercent(t.avgReliabilityScore)} ({t.partnerCount} partner{t.partnerCount === 1 ? "" : "s"})
                </p>
              ))
            )}
          </div>
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">District coverage</p>
            {data.insights.districtCoverage.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">No districts on file yet.</p>
            ) : (
              data.insights.districtCoverage.map((d) => (
                <p key={d.district} className="text-xs text-[var(--color-muted-foreground)]">
                  {d.district}: {d.verifiedPartnerCount} verified
                </p>
              ))
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-3">
            <Stat label="Known capacity" value={data.insights.totalKnownCapacity} />
            <Stat label="Executions this month" value={data.insights.executionsThisMonth} />
            <Stat label="Doc. approval rate" value={formatPercent(data.insights.documentationApprovalRateOverall)} />
          </div>
        </Card>
      </section>
    </div>
  );
}
