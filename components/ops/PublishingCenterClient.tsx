"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import { EvidenceCard } from "@/components/shared/EvidenceCard";
import { PublishedActDetail } from "@/components/acts/PublishedActDetail";
import {
  createPublicationAction,
  saveStoryPreparationAction,
  updateEvidenceSelectionAction,
  updateFinalApprovalAction,
  archivePublicationAction,
  publishAction,
  exportPublishingAction,
} from "@/lib/publishing-actions";
import type { PublishingCenterData, PublicationQueueItem, PublicationWorkflowStatus } from "@/lib/publishing";
import type { PublishedActSummary } from "@/lib/published-acts";

const STATUS_BADGE: Record<PublicationWorkflowStatus, { status: BadgeStatus; label: string }> = {
  ready_for_publishing: { status: "inactive", label: "Ready for publishing" },
  under_preparation: { status: "pending", label: "Under preparation" },
  awaiting_approval: { status: "pending", label: "Awaiting approval" },
  published: { status: "verified", label: "Published" },
  archived: { status: "inactive", label: "Archived" },
};

const CAUSES = ["Education", "Medical", "Annadhanam", "Environment"];
const STATUSES: PublicationWorkflowStatus[] = ["ready_for_publishing", "under_preparation", "awaiting_approval", "published", "archived"];

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
  link.download = "publishing-queue.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function PublicationPanel({ item, onDone }: { item: PublicationQueueItem; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(item.availablePhotos.filter((p) => p.selected).map((p) => p.id)));
  const [coverId, setCoverId] = useState<string | null>(item.availablePhotos.find((p) => p.isCover)?.id ?? null);

  async function handleSaveStory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await saveStoryPreparationAction(item.executionId, new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleSaveEvidence() {
    setPending(true);
    setError(null);
    const result = await updateEvidenceSelectionAction(item.executionId, Array.from(selectedIds), coverId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleSaveApproval(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateFinalApprovalAction(item.executionId, new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handlePublish() {
    setPending(true);
    setError(null);
    const result = await publishAction(item.executionId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleArchive() {
    setPending(true);
    setError(null);
    const result = await archivePublicationAction(item.executionId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  const coverPhoto = item.availablePhotos.find((p) => p.id === coverId);
  const previewSummary: PublishedActSummary = {
    id: item.executionId,
    cause: item.cause,
    title: item.actTitle,
    description: item.description ?? "",
    organization: item.partnerName ?? item.actTitle,
    missionDate: formatDate(item.scheduledDateIso),
    landmark: item.district,
    heroImageUrl: coverPhoto?.url ?? null,
    beneficiaryCount: item.beneficiaryCount,
    storySituation: item.storySituation,
    storyAction: item.storyAction,
    storyOutcome: item.storyOutcome,
    evidenceCount: selectedIds.size,
    gpsVerified: false,
    capturedBy: item.executionOwner ?? "AiA Operations",
    verifiedBy: item.preparedByName ?? "—",
    publishedAtDisplay: item.publicationDateIso ? formatDate(item.publicationDateIso) : "Not yet published",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Row 3 -- Story Preparation */}
      <section>
        <SectionHeader title="Story Preparation" />
        <Card className="mt-3">
          <form onSubmit={handleSaveStory} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Act title
              <input name="act_title" defaultValue={item.actTitle} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Outcome summary (feed card, outcome first -- no fundraising language, ~60s read)
              <textarea name="description" defaultValue={item.description ?? ""} rows={2} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Why this matters
              <textarea name="story_situation" defaultValue={item.storySituation ?? ""} rows={2} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              What we did
              <textarea name="story_action" defaultValue={item.storyAction ?? ""} rows={2} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Outcome
              <textarea name="story_outcome" defaultValue={item.storyOutcome ?? ""} rows={2} className={inputClass()} />
            </label>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Beneficiary count {item.beneficiaryCount ?? "—"} · {item.cause} · {item.district ?? "—"} (both real, not editable here)
            </p>
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Saving…" : "Save story"}
            </Button>
          </form>
        </Card>
      </section>

      {/* Row 4 -- Evidence Selection */}
      <section>
        <SectionHeader title="Evidence Selection" />
        <Card className="mt-3 flex flex-col gap-3">
          {item.availablePhotos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No approved photo evidence available to select from.</p>
          ) : (
            item.availablePhotos.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(photo.id)}
                    onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) next.add(photo.id);
                      else {
                        next.delete(photo.id);
                        if (coverId === photo.id) setCoverId(null);
                      }
                      setSelectedIds(next);
                    }}
                  />
                  {photo.fileName} <span className="text-xs text-[var(--color-muted-foreground)]">({photo.category.replace(/_/g, " ")})</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="cover"
                    checked={coverId === photo.id}
                    disabled={!selectedIds.has(photo.id)}
                    onChange={() => setCoverId(photo.id)}
                  />
                  Cover image
                </label>
              </div>
            ))
          )}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Video evidence isn&apos;t selectable yet -- see lib/publishing.ts for why.
          </p>
          <Button disabled={pending} onClick={handleSaveEvidence} className="self-start">
            {pending ? "Saving…" : "Save evidence selection"}
          </Button>
        </Card>
      </section>

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

      {/* Row 5 -- Publication Preview (reuses the real contributor-facing components) */}
      <section>
        <SectionHeader title="Publication Preview" />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Rendered with the exact CA-010/CA-011 components contributors will see.
        </p>
        <Card className="mt-3 flex flex-col gap-4 !p-0 overflow-hidden">
          <div className="p-5">
            <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">Acts Feed card</p>
            {coverPhoto?.url ? (
              <EvidenceCard
                actId={item.executionId}
                heroImage={coverPhoto.url}
                supportingImageCount={Math.max(selectedIds.size - 1, 0)}
                category={item.cause}
                placeName={item.district ?? item.partnerName ?? ""}
                completedDate={formatDate(item.scheduledDateIso)}
                headline={item.description ?? item.actTitle}
              />
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">Select a cover image to preview the feed card.</p>
            )}
          </div>
          <div className="border-t border-[var(--color-border)]">
            <p className="p-5 pb-2 text-xs font-medium text-[var(--color-muted-foreground)]">Act Detail page</p>
            <PublishedActDetail act={previewSummary} id={item.executionId} relatedActs={[]} />
          </div>
        </Card>
      </section>

      {/* Row 6 -- Final Approval */}
      <section>
        <SectionHeader title="Final Approval" />
        <Card className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 text-sm">
            <p>{item.checklist.documentationApproved ? "✓" : "○"} Documentation approved</p>
            <p>{item.checklist.storyComplete ? "✓" : "○"} Story complete</p>
            <p>{item.checklist.evidenceSelected ? "✓" : "○"} Evidence selected</p>
          </div>
          <form onSubmit={handleSaveApproval} className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="review_completed" defaultChecked={item.checklist.reviewCompleted} /> Review completed
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="publication_approved" defaultChecked={item.checklist.publicationApproved} /> Publication approved
            </label>
            <Button type="submit" variant="secondary" disabled={pending} className="self-start">
              Save approval
            </Button>
          </form>
          <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
            <Button disabled={pending || !item.canPublish} onClick={handlePublish}>
              Publish
            </Button>
            <Button variant="secondary" disabled={pending || item.status === "published"} onClick={handleArchive}>
              Archive
            </Button>
          </div>
        </Card>
      </section>

      {/* Row 8 -- Publication Timeline */}
      <section>
        <SectionHeader title="Publication Timeline" />
        <Card className="mt-3 flex flex-col gap-3">
          {item.timeline.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No publishing activity recorded yet.</p>
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

/** OP-007 Publishing Center (Locked v1.0). See lib/publishing.ts's own
 *  header comment for the two documented gaps (no video publishing, no
 *  post-publication correction metrics). Publishing writes into the same
 *  missions/evidence/mission_publications tables CA-010/CA-011 already
 *  read from -- there is no separate "Act" entity. */
export function PublishingCenterClient({ data }: { data: PublishingCenterData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createId, setCreateId] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [causeFilter, setCauseFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [preparerFilter, setPreparerFilter] = useState("All");

  const readyItems = useMemo(() => data.items.filter((i) => i.status === "ready_for_publishing"), [data.items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.items.filter((i) => {
      if (causeFilter !== "All" && i.cause !== causeFilter) return false;
      if (districtFilter !== "All" && i.district !== districtFilter) return false;
      if (statusFilter !== "All" && i.status !== statusFilter) return false;
      if (preparerFilter !== "All" && i.preparedByName !== preparerFilter) return false;
      if (q && !(i.executionId.toLowerCase().includes(q) || i.actTitle.toLowerCase().includes(q) || (i.district ?? "").toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [data.items, search, causeFilter, districtFilter, statusFilter, preparerFilter]);

  const selectedItem = data.items.find((i) => i.executionId === selectedId) ?? null;

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!createId) {
      setCreateError("Choose an execution first.");
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    const result = await createPublicationAction(createId);
    setCreatePending(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setSelectedId(createId);
    setCreateId("");
  }

  async function handleExport() {
    setExportPending(true);
    setExportError(null);
    const result = await exportPublishingAction();
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
        <Link href="/ops/documentation" className="text-sm text-[var(--color-muted-foreground)] underline">
          Documentation
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          Publishing Center
        </h1>
        <Card className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Ready for publishing" value={data.readyForPublishing} />
          <Stat label="Published this month" value={data.publishedThisMonth} />
          <Stat label="Avg. publish time" value={formatDays(data.avgPublishTimeDays)} />
          <Stat label="Pending final review" value={data.pendingFinalReview} />
        </Card>

        <Card className="mt-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[var(--color-foreground)]">Create publication</p>
          {readyItems.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">No approved documentation is ready for publishing yet.</p>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <select value={createId} onChange={(e) => setCreateId(e.target.value)} className={selectClass()}>
                <option value="">Select an execution…</option>
                {readyItems.map((i) => (
                  <option key={i.executionId} value={i.executionId}>
                    {i.actTitle}
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

      {/* Row 1 -- Publishing Queue */}
      <section>
        <SectionHeader title="Publishing Queue" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Ready for publishing" value={data.queueCounts.readyForPublishing} />
          <Stat label="Under preparation" value={data.queueCounts.underPreparation} />
          <Stat label="Awaiting approval" value={data.queueCounts.awaitingApproval} />
          <Stat label="Published" value={data.queueCounts.published} />
          <Stat label="Archived" value={data.queueCounts.archived} />
        </Card>
      </section>

      {/* Row 2 -- Publication Table */}
      <section>
        <SectionHeader title="Publications" />
        <Card className="mt-3 flex flex-col gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by execution ID, act title, district…"
            className={inputClass()}
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass()}>
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_BADGE[s].label}
                </option>
              ))}
            </select>
            <select value={preparerFilter} onChange={(e) => setPreparerFilter(e.target.value)} className={selectClass()}>
              <option value="All">All preparers</option>
              {data.preparers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No publications match these filters.</p>
          ) : (
            filtered.map((item) => (
              <div key={item.executionId} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                <div>
                  <button
                    type="button"
                    className="font-medium text-[var(--color-primary)] underline disabled:no-underline disabled:text-[var(--color-muted-foreground)]"
                    disabled={item.status === "ready_for_publishing"}
                    onClick={() => setSelectedId(item.executionId)}
                  >
                    {item.actTitle}
                  </button>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {item.executionId.slice(0, 8)} · {item.cause} · {item.district ?? "—"} · {item.preparedByName ?? "Not started"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge {...STATUS_BADGE[item.status]} />
                  <p className="text-xs text-[var(--color-muted-foreground)]">{formatDate(item.publicationDateIso)}</p>
                  {item.publishedMissionId && (
                    <a href={`/acts/${item.publishedMissionId}`} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] underline">
                      View live
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {selectedItem && <PublicationPanel key={selectedItem.executionId} item={selectedItem} onDone={() => setSelectedId(null)} />}

      {/* Row 7 -- Publishing Metrics */}
      <section>
        <SectionHeader title="Publishing Metrics" />
        <Card className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Published this month" value={data.metrics.publishedThisMonth} />
          <Stat label="Avg. publish time" value={formatDays(data.metrics.avgPublishTimeDays)} />
          <Stat label="Publication accuracy rate" value="—" />
          <Stat label="Corrections required" value="—" />
        </Card>
      </section>
    </div>
  );
}
