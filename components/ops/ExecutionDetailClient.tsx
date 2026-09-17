"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Badge, type BadgeStatus } from "@/components/shared/Badge";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";
import {
  saveOutcomeAction,
  uploadEvidenceAction,
  replaceEvidenceAction,
  deleteEvidenceAction,
  submitForReviewAction,
} from "@/lib/execution-detail-actions";
import { completeExecutionAction } from "@/lib/execution-actions";
import type { ExecutionDetail, EvidenceCategory, DocumentationReadiness } from "@/lib/execution-detail";

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  before_photo: "Before photos",
  after_photo: "After photos",
  execution_photo: "Execution photos",
  video: "Videos",
  supporting_document: "Supporting documents",
};

const CATEGORY_ACCEPT: Record<EvidenceCategory, string> = {
  before_photo: "image/*",
  after_photo: "image/*",
  execution_photo: "image/*",
  video: "video/*",
  supporting_document: "image/*,.pdf,.doc,.docx",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as EvidenceCategory[];

const READINESS_BADGE: Record<DocumentationReadiness, { status: BadgeStatus; label: string }> = {
  draft: { status: "inactive", label: "Draft" },
  incomplete: { status: "pending", label: "Incomplete" },
  ready_for_review: { status: "pending", label: "Ready for review" },
  submitted: { status: "verified", label: "Submitted" },
  approved: { status: "verified", label: "Approved" },
  rejected: { status: "error", label: "Rejected" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]";
}

function CategoryUpload({
  executionId,
  category,
  files,
  onDone,
}: {
  executionId: string;
  category: EvidenceCategory;
  files: ExecutionDetail["evidence"];
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function uploadFile(file: File, replaceId?: string) {
    setPending(true);
    setError(null);
    const supabase = getSupabaseAuthBrowserClient();
    if (!supabase) {
      setPending(false);
      setError("Supabase is not configured on this deployment.");
      return;
    }
    const path = `${executionId}/${category}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("execution-evidence")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) {
      setPending(false);
      setError(uploadError.message);
      return;
    }
    const fileType = file.type || "application/octet-stream";
    const result = replaceId
      ? await replaceEvidenceAction(replaceId, category, file.name, fileType, path)
      : await uploadEvidenceAction(executionId, category, file.name, fileType, path);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function handleDelete(evidenceId: string) {
    setPending(true);
    setError(null);
    const result = await deleteEvidenceAction(evidenceId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{CATEGORY_LABELS[category]}</p>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={CATEGORY_ACCEPT[category]}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {files.length === 0 ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">No files uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {f.url && f.fileType.startsWith("image/") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.fileName} className="h-10 w-10 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{f.fileName}</p>
                  <p className="text-[var(--color-muted-foreground)]">
                    {formatDate(f.uploadedAtIso)} · {f.uploadedByName ?? "Unknown"} · {f.status}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {f.url && (
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">
                    Preview
                  </a>
                )}
                <button
                  type="button"
                  className="text-[var(--color-primary)] underline"
                  disabled={pending}
                  onClick={() => replaceInputRefs.current[f.id]?.click()}
                >
                  Replace
                </button>
                <input
                  ref={(el) => {
                    replaceInputRefs.current[f.id] = el;
                  }}
                  type="file"
                  accept={CATEGORY_ACCEPT[category]}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file, f.id);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="text-[var(--color-error)] underline"
                  disabled={pending}
                  onClick={() => handleDelete(f.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

/** OP-005A Execution Detail & Evidence Upload (Locked v1.0). See
 *  lib/execution-detail.ts's own header comment for the documented
 *  simplifications (Evidence Categories vs. Upload Types, and "required
 *  documents" having no per-opportunity list to check against). */
export function ExecutionDetailClient({ execution }: { execution: ExecutionDetail }) {
  const router = useRouter();
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [completePending, setCompletePending] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  async function handleSaveOutcome(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavePending(true);
    setSaveError(null);
    setSaveMessage(null);
    const result = await saveOutcomeAction(execution.id, new FormData(e.currentTarget));
    setSavePending(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setSaveMessage("Draft saved.");
    refresh();
  }

  async function handleMarkComplete() {
    setCompletePending(true);
    setCompleteError(null);
    const result = await completeExecutionAction(execution.id);
    setCompletePending(false);
    if (result.error) {
      setCompleteError(result.error);
      return;
    }
    refresh();
  }

  async function handleSubmitForReview() {
    setSubmitPending(true);
    setSubmitError(null);
    const result = await submitForReviewAction(execution.id);
    setSubmitPending(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
      <Link href="/ops/executions" className="text-sm text-[var(--color-muted-foreground)] underline">
        ← Executions
      </Link>

      {/* Header */}
      <div>
        <p className="text-sm text-[var(--color-muted-foreground)]">{execution.id.slice(0, 8)}</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          {execution.opportunityTitle}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {execution.cause} · {execution.district ?? "—"} · {execution.status} · Owner: {execution.executionOwner ?? "Unassigned"}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Scheduled {formatDate(execution.scheduledDate)} · Completed {formatDate(execution.completedAtIso)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" form="outcome-form" disabled={savePending}>
            {savePending ? "Saving…" : "Save draft"}
          </Button>
          <Button variant="secondary" disabled={completePending} onClick={handleMarkComplete}>
            {completePending ? "Marking…" : "Mark complete"}
          </Button>
          <Button
            variant="secondary"
            disabled={submitPending || !execution.canSubmitForReview}
            onClick={handleSubmitForReview}
          >
            {submitPending ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
        {saveError && <p className="mt-2 text-sm text-[var(--color-error)]">{saveError}</p>}
        {saveMessage && <p className="mt-2 text-sm text-[var(--color-primary)]">{saveMessage}</p>}
        {completeError && <p className="mt-2 text-sm text-[var(--color-error)]">{completeError}</p>}
        {submitError && <p className="mt-2 text-sm text-[var(--color-error)]">{submitError}</p>}
      </div>

      {/* Section 1 -- Execution Summary */}
      <section>
        <SectionHeader title="Execution Summary" />
        <Card className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Partner</p>
            <p>{execution.partnerName ?? "No partner"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Priority</p>
            <p>{execution.priority}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Beneficiary estimate</p>
            <p>{execution.beneficiaryEstimate ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Current status</p>
            <p>{execution.status}</p>
          </div>
        </Card>
      </section>

      {/* Section 2 -- Outcome Recording */}
      <section>
        <SectionHeader title="Outcome Recording" />
        <Card className="mt-3">
          <form id="outcome-form" onSubmit={handleSaveOutcome} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Actual beneficiaries
              <input
                name="actual_beneficiaries"
                type="number"
                min={0}
                defaultValue={execution.actualBeneficiaries ?? ""}
                className={inputClass()}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Outcome summary
              <textarea name="outcome_summary" defaultValue={execution.outcomeSummary ?? ""} rows={3} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Completion notes
              <textarea name="completion_notes" defaultValue={execution.completionNotes ?? ""} rows={2} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Unexpected issues
              <textarea name="unexpected_issues" defaultValue={execution.unexpectedIssues ?? ""} rows={2} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Lessons learned
              <textarea name="lessons_learned" defaultValue={execution.lessonsLearned ?? ""} rows={2} className={inputClass()} />
            </label>
          </form>
        </Card>
      </section>

      {/* Section 3 -- Evidence Upload */}
      <section>
        <SectionHeader title="Evidence Upload" />
        <Card className="mt-3 flex flex-col gap-4">
          {CATEGORIES.map((category) => (
            <CategoryUpload
              key={category}
              executionId={execution.id}
              category={category}
              files={execution.evidence.filter((f) => f.category === category)}
              onDone={refresh}
            />
          ))}
        </Card>
      </section>

      {/* Section 4 -- Evidence Quality Checklist */}
      <section>
        <SectionHeader title="Evidence Quality Checklist" />
        <Card className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-[var(--color-muted-foreground)]">{execution.completionPercentage}% complete</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <p>{execution.checklist.photosUploaded ? "✓" : "○"} Photos uploaded (at least one After photo)</p>
            <p>{execution.checklist.outcomeRecorded ? "✓" : "○"} Outcome recorded</p>
            <p>{execution.checklist.beneficiaryCountRecorded ? "✓" : "○"} Beneficiary count recorded</p>
            <p>{execution.checklist.completionNotesAdded ? "✓" : "○"} Completion notes added</p>
            <p>{execution.checklist.requiredDocumentsAttached ? "✓" : "○"} Required documents attached</p>
          </div>
          {execution.missingItems.length > 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)]">Missing: {execution.missingItems.join(", ")}</p>
          )}
        </Card>
      </section>

      {/* Section 5 -- Documentation Readiness */}
      <section>
        <SectionHeader title="Documentation Readiness" />
        <Card className="mt-3 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {execution.evidence.length} evidence file(s) · {execution.completionPercentage}% checklist complete
          </p>
          <Badge {...READINESS_BADGE[execution.documentationReadiness]} />
        </Card>
      </section>

      {/* Section 6 -- Review Submission */}
      <section>
        <SectionHeader title="Review Submission" />
        <Card className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {execution.canSubmitForReview
              ? "The checklist is complete -- this execution is ready for documentation review."
              : "Complete the Evidence Quality Checklist above before submitting for review."}
          </p>
          {execution.submittedForReviewAtIso && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Submitted {formatDateTime(execution.submittedForReviewAtIso)}
            </p>
          )}
          <Button disabled={submitPending || !execution.canSubmitForReview} onClick={handleSubmitForReview} className="self-start">
            {submitPending ? "Submitting…" : "Submit for Documentation Review"}
          </Button>
        </Card>
      </section>

      {/* Section 7 -- Activity Timeline */}
      <section>
        <SectionHeader title="Activity Timeline" />
        <Card className="mt-3 flex flex-col gap-3">
          {execution.timeline.map((entry, i) => (
            <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
              <span>{entry.label}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">{formatDateTime(entry.dateIso)}</span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
