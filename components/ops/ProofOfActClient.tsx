"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { ActProofCard } from "@/components/acts/ActProofCard";
import { CAUSES } from "@/types/participation";
import { sendActProofAction } from "@/lib/act-proofs-actions";
import type { ProofRecipientCandidate } from "@/lib/act-proofs";

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]";
}

function selectClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

function formatDateDisplay(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "No date entered yet";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * OP-010 Proof of Act's entry point. An operator manually enters an act's
 * details (not pulled from a real mission -- see act_proofs' own
 * comment), picks a recipient, reviews an exact preview of what gets
 * sent, and confirms. Nothing is persisted until that confirm step.
 *
 * Three-stage flow (form -> confirm -> sent), matching the "explicit
 * confirmation before sending" requirement without inventing a new UI
 * primitive: the confirm stage reuses the existing BottomSheet (already
 * built for the Participation Flow's own confirmation step).
 */
export function ProofOfActClient({ recipients }: { recipients: ProofRecipientCandidate[] }) {
  const [actTitle, setActTitle] = useState("");
  const [actDate, setActDate] = useState("");
  const [cause, setCause] = useState("");
  const [organization, setOrganization] = useState("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [contributorId, setContributorId] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentProofId, setSentProofId] = useState<string | null>(null);

  const selectedRecipient = useMemo(() => recipients.find((r) => r.id === contributorId) ?? null, [recipients, contributorId]);

  const canReview = Boolean(actTitle.trim() && actDate && cause && organization.trim() && description.trim() && contributorId);

  async function handleConfirmSend() {
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("act_title", actTitle.trim());
    formData.set("act_date", actDate);
    formData.set("cause", cause);
    formData.set("organization", organization.trim());
    formData.set("landmark", landmark.trim());
    formData.set("description", description.trim());
    formData.set("outcome_summary", outcomeSummary.trim());
    formData.set("hero_image_url", heroImageUrl.trim());
    formData.set("contributor_id", contributorId);

    const result = await sendActProofAction(formData);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    setSentProofId(result.proofId ?? null);
  }

  function handleSendAnother() {
    setActTitle("");
    setActDate("");
    setCause("");
    setOrganization("");
    setLandmark("");
    setDescription("");
    setOutcomeSummary("");
    setHeroImageUrl("");
    setContributorId("");
    setSentProofId(null);
    setError(null);
  }

  if (sentProofId) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
            ← Dashboard
          </Link>
        </div>
        <Card className="flex flex-col gap-3 text-center">
          <p className="text-lg font-semibold leading-snug">Proof of Act sent</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            A notification now points {selectedRecipient?.name ?? "the contributor"} to this proof. In-app only -- no
            email or SMS was sent.
          </p>
          <Link href={`/proof/${sentProofId}`} target="_blank" className="text-sm text-[var(--color-primary)] underline">
            View it as they&apos;ll see it →
          </Link>
          <Button className="mt-1 w-full" onClick={handleSendAnother}>
            Send another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
      <div className="flex items-center gap-3">
        <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
          ← Dashboard
        </Link>
        <Link href="/ops/contributors" className="text-sm text-[var(--color-muted-foreground)] underline">
          Contributors
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">Proof of Act</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Manually record an act and share it with one contributor. This doesn&apos;t need to be a published Act already
          in the app -- the entered details are what gets shown, with no Verified badge or claim.
        </p>
      </div>

      <section>
        <SectionHeader title="Act details" />
        <Card className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Act title
            <input value={actTitle} onChange={(e) => setActTitle(e.target.value)} className={inputClass()} placeholder="e.g. Annadhanam for Elders" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Date
              <input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} className={inputClass()} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Cause
              <select value={cause} onChange={(e) => setCause(e.target.value)} className={selectClass()}>
                <option value="">Select a cause…</option>
                {CAUSES.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Organization / foundation
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass()} placeholder="e.g. Annai Aravindhar Karunai Illam" />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Place <span className="text-[var(--color-muted-foreground)]">(optional)</span>
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} className={inputClass()} placeholder="e.g. Kumbakonam, Thanjavur" />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass()} resize-none`}
              placeholder="What happened"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Outcome <span className="text-[var(--color-muted-foreground)]">(optional)</span>
            <input value={outcomeSummary} onChange={(e) => setOutcomeSummary(e.target.value)} className={inputClass()} placeholder="e.g. 45 elders served" />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Photo URL <span className="text-[var(--color-muted-foreground)]">(optional)</span>
            <input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} className={inputClass()} placeholder="https://…" />
          </label>
        </Card>
      </section>

      <section>
        <SectionHeader title="Recipient" />
        <Card className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Contributor
            <select value={contributorId} onChange={(e) => setContributorId(e.target.value)} className={selectClass()}>
              <option value="">Select a contributor…</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email || "no email on file"}) · {r.lifetimeParticipations} lifetime participation
                  {r.lifetimeParticipations === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Only real contributor accounts are selectable, never a typed-in name or email. The next step shows exactly
            who you&apos;re about to send to before anything is saved.
          </p>
        </Card>
      </section>

      <section>
        <SectionHeader title="Preview" />
        <div className="mt-3">
          <ActProofCard
            actTitle={actTitle}
            actDateDisplay={formatDateDisplay(actDate)}
            cause={cause || "Cause"}
            organization={organization || "Organization"}
            landmark={landmark || null}
            description={description}
            outcomeSummary={outcomeSummary || null}
            heroImageUrl={heroImageUrl || null}
          />
        </div>
      </section>

      {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}

      <Button
        variant="primary"
        className="w-full"
        disabled={!canReview}
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
      >
        Review &amp; send
      </Button>

      <BottomSheet open={confirmOpen} onClose={() => !isPending && setConfirmOpen(false)}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-[var(--color-foreground)]">Confirm before sending</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              This creates an in-app notification for{" "}
              <span className="font-medium text-[var(--color-foreground)]">{selectedRecipient?.name}</span> (
              {selectedRecipient?.email || "no email on file"}) linking to the proof below. No email or SMS is sent.
            </p>
          </div>

          <ActProofCard
            actTitle={actTitle}
            actDateDisplay={formatDateDisplay(actDate)}
            cause={cause}
            organization={organization}
            landmark={landmark || null}
            description={description}
            outcomeSummary={outcomeSummary || null}
            heroImageUrl={heroImageUrl || null}
          />

          {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Back to edit
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleConfirmSend} disabled={isPending}>
              {isPending ? "Sending…" : "Confirm & send"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
