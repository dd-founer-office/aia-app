"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import { STAGE_LABELS, STAGE_ORDER } from "@/types";
import { CAUSES, type CauseId } from "@/types/participation";
import { exportContributorsAction, exportCommunityReportAction, recordPastParticipationAction } from "@/lib/contributors-actions";
import type { ContributorManagementData, ContributorRow, ContributorStatus, SuggestedAction } from "@/lib/contributors";

const STATUS_BADGE: Record<ContributorStatus, { status: BadgeStatus; label: string }> = {
  active: { status: "verified", label: "Active" },
  at_risk: { status: "pending", label: "At risk" },
  inactive: { status: "inactive", label: "Inactive" },
};

const SUGGESTED_ACTION_LABEL: Record<SuggestedAction, string> = {
  reminder: "Reminder",
  community_outreach: "Community outreach",
  no_action: "No action",
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

function formatMonths(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)} mo`;
}

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]";
}

function selectClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function downloadText(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Founder-directed addition (2026-09-21), not part of OP-008's locked
 *  spec: lets an operator backfill a real contributor's past participation
 *  (e.g. a contributor who joined the app after already participating for
 *  months, like Rabia from March) so their Journey stage, continuity
 *  streak, and Lifetime Acts count reflect reality. See
 *  recordPastParticipationAction's own comment for why this must be done
 *  oldest-month-first when backfilling more than one month. */
function RecordPastParticipationForm({ contributorId, onRecorded }: { contributorId: string; onRecorded: () => void }) {
  const maxMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState("");
  const [selectedCauses, setSelectedCauses] = useState<CauseId[]>([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [splits, setSplits] = useState<Partial<Record<CauseId, string>>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleCause(id: CauseId) {
    setSuccess(null);
    setSelectedCauses((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  const allocatedSum = selectedCauses.reduce((sum, id) => sum + (Number(splits[id]) || 0), 0);
  const totalAmountNumber = Number(totalAmount) || 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const causeAllocationsRupees: Partial<Record<CauseId, number>> = {};
    for (const id of selectedCauses) causeAllocationsRupees[id] = Number(splits[id]) || 0;

    setPending(true);
    const result = await recordPastParticipationAction(contributorId, month, selectedCauses, totalAmountNumber, causeAllocationsRupees);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(`Recorded participation for ${month}.`);
    setMonth("");
    setSelectedCauses([]);
    setTotalAmount("");
    setSplits({});
    onRecorded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
      <p className="text-sm font-medium text-[var(--color-foreground)]">Record past participation</p>
      <label className="flex flex-col gap-1 text-xs">
        Month
        <input type="month" required max={maxMonth} value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass()} />
      </label>
      <div className="flex flex-wrap gap-3">
        {CAUSES.map((cause) => (
          <label key={cause.id} className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={selectedCauses.includes(cause.id)} onChange={() => toggleCause(cause.id)} />
            {cause.title}
          </label>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs">
        Total amount (₹)
        <input type="number" min={1} step={1} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className={inputClass()} />
      </label>
      {selectedCauses.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedCauses.map((id) => (
            <label key={id} className="flex items-center justify-between gap-2 text-xs">
              {CAUSES.find((c) => c.id === id)?.title} split (₹)
              <input
                type="number"
                min={0}
                step={1}
                value={splits[id] ?? ""}
                onChange={(e) => setSplits((prev) => ({ ...prev, [id]: e.target.value }))}
                className={`${inputClass()} w-28`}
              />
            </label>
          ))}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Split total: ₹{allocatedSum} of ₹{totalAmountNumber}
          </p>
        </div>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Recording…" : "Record participation"}
      </Button>
      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
      {success && <p className="text-sm text-[var(--color-primary)]">{success}</p>}
    </form>
  );
}

function ContributorDetailPanel({ contributor, onParticipationRecorded }: { contributor: ContributorRow; onParticipationRecorded: () => void }) {
  const label = STAGE_LABELS[contributor.currentStage];
  return (
    <section>
      <SectionHeader title="Contributor Detail" />
      <Card className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Contributor</p>
            <p>{contributor.name}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Status</p>
            <Badge {...STATUS_BADGE[contributor.status]} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Journey stage</p>
            <p>{label.emoji} {label.en}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Country</p>
            <p>{contributor.country ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Continuity</p>
            <p>{contributor.currentContinuity} mo (longest {contributor.longestContinuity} mo)</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Lifetime participations</p>
            <p>{contributor.lifetimeParticipations}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-[var(--color-muted-foreground)]">Last participation</p>
            <p>{formatDate(contributor.lastParticipationDateIso)}</p>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">Cause preferences</p>
          {contributor.causeDistribution.every((c) => c.participationCount === 0) ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">No participation history yet.</p>
          ) : (
            contributor.causeDistribution
              .filter((c) => c.participationCount > 0)
              .map((c) => (
                <p key={c.causeId} className="text-xs text-[var(--color-muted-foreground)]">
                  {c.title}: {c.participationCount}
                </p>
              ))
          )}
        </div>

        {contributor.suggestedAction && (
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Suggested action</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{SUGGESTED_ACTION_LABEL[contributor.suggestedAction]} -- supportive outreach only, no pressure tactics.</p>
          </div>
        )}

        {/* Row 7's "Recent acts viewed" is intentionally omitted -- nothing
            in the app records which published Acts a contributor has
            viewed, so there's no real data to show here. */}

        <RecordPastParticipationForm contributorId={contributor.id} onRecorded={onParticipationRecorded} />
      </Card>
    </section>
  );
}

/** OP-008 Contributor Management (Locked v1.0). See lib/contributors.ts's
 *  own header comment for the documented simplifications (this-month-vs-
 *  last-month comparisons in place of multi-month trend lines; no "recent
 *  acts viewed" tracking anywhere in the app). No separate OP-008A screen
 *  exists in the locked spec -- same one-page-plus-selection architecture
 *  as OP-006/OP-007: selecting a contributor row drives the Row 7 detail
 *  panel below the table rather than navigating to a dedicated page. */
export function ContributorManagementClient({ data }: { data: ContributorManagementData }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [continuityMin, setContinuityMin] = useState("");
  const [continuityMax, setContinuityMax] = useState("");
  const [participationMin, setParticipationMin] = useState("");
  const [participationMax, setParticipationMax] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cMin = continuityMin.trim() === "" ? null : Number(continuityMin);
    const cMax = continuityMax.trim() === "" ? null : Number(continuityMax);
    const pMin = participationMin.trim() === "" ? null : Number(participationMin);
    const pMax = participationMax.trim() === "" ? null : Number(participationMax);
    return data.contributors.filter((c) => {
      if (countryFilter !== "All" && c.country !== countryFilter) return false;
      if (stageFilter !== "All" && c.currentStage !== stageFilter) return false;
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (monthFilter !== "All" && c.lastParticipationMonth !== monthFilter) return false;
      if (cMin !== null && c.currentContinuity < cMin) return false;
      if (cMax !== null && c.currentContinuity > cMax) return false;
      if (pMin !== null && c.lifetimeParticipations < pMin) return false;
      if (pMax !== null && c.lifetimeParticipations > pMax) return false;
      if (q && !(c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.country ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data.contributors, search, countryFilter, stageFilter, statusFilter, monthFilter, continuityMin, continuityMax, participationMin, participationMax]);

  const selectedContributor = data.contributors.find((c) => c.id === selectedId) ?? null;

  async function handleExport() {
    setExportPending(true);
    setExportError(null);
    const result = await exportContributorsAction();
    setExportPending(false);
    if (result.error) {
      setExportError(result.error);
      return;
    }
    if (result.csv) downloadText(result.csv, "contributors.csv", "text/csv;charset=utf-8;");
  }

  async function handleCommunityReport() {
    setReportPending(true);
    setReportError(null);
    const result = await exportCommunityReportAction();
    setReportPending(false);
    if (result.error) {
      setReportError(result.error);
      return;
    }
    if (result.report) downloadText(result.report, "community-report.txt", "text/plain;charset=utf-8;");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
          ← Dashboard
        </Link>
        <Link href="/ops/partners" className="text-sm text-[var(--color-muted-foreground)] underline">
          Partners
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          Contributor Management
        </h1>
        <Card className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total contributors" value={data.healthOverview.total} />
          <Stat label="Participated this month" value={data.healthOverview.activeThisMonth} />
          <Stat label="Average continuity" value={formatMonths(data.healthOverview.averageContinuity)} />
          <Stat label="At-risk contributors" value={data.healthOverview.atRisk} />
        </Card>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={exportPending}>
            {exportPending ? "Exporting…" : "Export"}
          </Button>
          <Button variant="secondary" onClick={handleCommunityReport} disabled={reportPending}>
            {reportPending ? "Preparing…" : "Community report"}
          </Button>
        </div>
        {exportError && <p className="mt-2 text-sm text-[var(--color-error)]">{exportError}</p>}
        {reportError && <p className="mt-2 text-sm text-[var(--color-error)]">{reportError}</p>}
      </div>

      {/* Row 1 -- Community Health Overview */}
      <section>
        <SectionHeader title="Community Health Overview" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Total" value={data.healthOverview.total} />
          <Stat label="Active this month" value={data.healthOverview.activeThisMonth} />
          <Stat label="New" value={data.healthOverview.newThisMonth} />
          <Stat label="At risk" value={data.healthOverview.atRisk} />
          <Stat label="Avg. continuity" value={formatMonths(data.healthOverview.averageContinuity)} />
        </Card>
      </section>

      {/* Row 2 -- Journey Stage Distribution */}
      <section>
        <SectionHeader title="Journey Stage Distribution" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {data.stageDistribution.map((s) => {
            const label = STAGE_LABELS[s.stage];
            return (
              <div key={s.stage}>
                <p className="text-lg font-medium text-[var(--color-foreground)]">
                  {label.emoji} {s.count}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{label.en} · {formatPercent(s.pct)}</p>
              </div>
            );
          })}
        </Card>
      </section>

      {/* Row 3 -- Continuity Overview */}
      <section>
        <SectionHeader title="Continuity Overview" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Current average continuity" value={formatMonths(data.continuityOverview.currentAverageContinuity)} />
          <Stat label="Longest community continuity" value={formatMonths(data.continuityOverview.longestCommunityContinuity)} />
          <Stat label="Continuity retention rate" value={formatPercent(data.continuityOverview.continuityRetentionRate)} />
        </Card>
      </section>

      {/* Row 4 -- Participation Overview */}
      <section>
        <SectionHeader title="Participation Overview" />
        <Card className="mt-3 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Stat label="Participated this month" value={data.participationOverview.participatedThisMonth} />
            <Stat label="Participated last month" value={data.participationOverview.participatedLastMonth} />
          </div>
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Cause participation distribution</p>
            {data.participationOverview.causeDistribution.every((c) => c.participationCount === 0) ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">No participation history yet.</p>
            ) : (
              data.participationOverview.causeDistribution.map((c) => (
                <p key={c.causeId} className="text-xs text-[var(--color-muted-foreground)]">
                  {c.title}: {c.participationCount}
                </p>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Row 5 -- Contributor Table */}
      <section>
        <SectionHeader title="Contributors" />
        <Card className="mt-3 flex flex-col gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, name, country…" className={inputClass()} />
          <div className="flex flex-wrap gap-2">
            <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={selectClass()}>
              <option value="All">All countries</option>
              {data.countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={selectClass()}>
              <option value="All">All stages</option>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s].emoji} {STAGE_LABELS[s].en}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass()}>
              <option value="All">All statuses</option>
              {(Object.keys(STATUS_BADGE) as ContributorStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_BADGE[s].label}
                </option>
              ))}
            </select>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={selectClass()}>
              <option value="All">All months (last participation)</option>
              {data.months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs">
              Continuity min
              <input type="number" min={0} value={continuityMin} onChange={(e) => setContinuityMin(e.target.value)} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Continuity max
              <input type="number" min={0} value={continuityMax} onChange={(e) => setContinuityMax(e.target.value)} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Participations min
              <input type="number" min={0} value={participationMin} onChange={(e) => setParticipationMin(e.target.value)} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Participations max
              <input type="number" min={0} value={participationMax} onChange={(e) => setParticipationMax(e.target.value)} className={inputClass()} />
            </label>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No contributors match these filters.</p>
          ) : (
            filtered.map((c) => {
              const label = STAGE_LABELS[c.currentStage];
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <button type="button" className="font-medium text-[var(--color-primary)] underline" onClick={() => setSelectedId(c.id)}>
                      {c.name}
                    </button>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {c.id.slice(0, 8)} · {c.country ?? "—"} · {label.emoji} {label.en} · {c.currentContinuity} mo continuity · {c.lifetimeParticipations} lifetime · last {formatDate(c.lastParticipationDateIso)}
                    </p>
                  </div>
                  <Badge {...STATUS_BADGE[c.status]} />
                </div>
              );
            })
          )}
        </Card>
      </section>

      {/* Row 6 -- At-Risk Contributors */}
      <section>
        <SectionHeader title="At-Risk Contributors" />
        <Card className="mt-3 flex flex-col gap-2">
          {data.atRiskContributors.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No contributors currently at risk.</p>
          ) : (
            data.atRiskContributors.map((c) => {
              const label = STAGE_LABELS[c.currentStage];
              return (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <button type="button" className="text-[var(--color-primary)] underline" onClick={() => setSelectedId(c.id)}>
                    {c.name}
                  </button>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {label.emoji} {label.en} · last {formatDate(c.lastParticipationDateIso)} · {c.currentContinuity} mo · {c.suggestedAction ? SUGGESTED_ACTION_LABEL[c.suggestedAction] : "—"}
                  </span>
                </div>
              );
            })
          )}
        </Card>
      </section>

      {/* Row 7 -- Contributor Detail Preview */}
      {selectedContributor && (
        <ContributorDetailPanel
          key={selectedContributor.id}
          contributor={selectedContributor}
          onParticipationRecorded={() => router.refresh()}
        />
      )}

      {/* Row 8 -- Community Insights */}
      <section>
        <SectionHeader title="Community Insights" />
        <Card className="mt-3 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">Fastest growing stage</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {data.insights.fastestGrowingStage
                ? `${STAGE_LABELS[data.insights.fastestGrowingStage.stage].emoji} ${STAGE_LABELS[data.insights.fastestGrowingStage.stage].en} — ${data.insights.fastestGrowingStage.countThisMonth} contributor${data.insights.fastestGrowingStage.countThisMonth === 1 ? "" : "s"} reached it this month`
                : "No stage advancement recorded this month."}
            </p>
          </div>
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Most common cause</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {data.insights.mostCommonCause ? `${data.insights.mostCommonCause.title} (${data.insights.mostCommonCause.participationCount})` : "No participation data yet."}
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
