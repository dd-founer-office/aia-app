"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { ActProofCard } from "@/components/acts/ActProofCard";
import { ActProofMediaUpload } from "@/components/ops/ActProofMediaUpload";
import { CAUSES } from "@/types/participation";
import { sendActProofAction } from "@/lib/act-proofs-actions";
import type { ProofRecipientCandidate } from "@/lib/act-proofs";

interface EvidenceDraft {
  key: string;
  photoUrl: string;
  caption: string;
}

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

type RecipientMode = "contributor" | "name";

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browsers, non-HTTPS) --
      // the link is still shown as selectable text either way.
    }
  }

  return (
    <Button variant="secondary" className="w-full" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

/**
 * OP-010 Proof of Act's entry point. An operator manually enters an act's
 * details (not pulled from a real mission -- see act_proofs' own
 * comment), picks or names a recipient, reviews an exact preview of what
 * gets shared, and confirms. Nothing is persisted until that confirm
 * step. The result is a public, unlisted link (/proof/<id>) the operator
 * shares themselves -- no notification, email, or SMS is sent by this
 * app.
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
  const [storySituation, setStorySituation] = useState("");
  const [storyAction, setStoryAction] = useState("");
  const [storyOutcome, setStoryOutcome] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [testimonialAttribution, setTestimonialAttribution] = useState("");
  const [testimonialVideoUrl, setTestimonialVideoUrl] = useState("");
  const [reflection, setReflection] = useState("");
  const [evidenceDrafts, setEvidenceDrafts] = useState<EvidenceDraft[]>([]);

  const [recipientMode, setRecipientMode] = useState<RecipientMode>("contributor");
  const [contributorId, setContributorId] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentProofId, setSentProofId] = useState<string | null>(null);
  const [sentOrigin, setSentOrigin] = useState("");

  const selectedRecipient = useMemo(() => recipients.find((r) => r.id === contributorId) ?? null, [recipients, contributorId]);
  const recipientLabel = recipientMode === "contributor" ? selectedRecipient?.name : recipientName.trim();

  const hasRecipient = recipientMode === "contributor" ? Boolean(contributorId) : Boolean(recipientName.trim());
  const canReview = Boolean(actTitle.trim() && actDate && cause && organization.trim() && description.trim() && hasRecipient);

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
    formData.set("story_situation", storySituation.trim());
    formData.set("story_action", storyAction.trim());
    formData.set("story_outcome", storyOutcome.trim());
    formData.set("testimonial_quote", testimonialQuote.trim());
    formData.set("testimonial_attribution", testimonialAttribution.trim());
    formData.set("testimonial_video_url", testimonialVideoUrl.trim());
    formData.set("reflection", reflection.trim());
    formData.set("contributor_id", recipientMode === "contributor" ? contributorId : "");
    formData.set("recipient_name", recipientMode === "name" ? recipientName.trim() : "");
    formData.set(
      "evidence_items",
      JSON.stringify(
        evidenceDrafts.filter((d) => d.photoUrl).map((d) => ({ photoUrl: d.photoUrl, caption: d.caption.trim() || null }))
      )
    );

    const result = await sendActProofAction(formData);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    setSentProofId(result.proofId ?? null);
    setSentOrigin(typeof window !== "undefined" ? window.location.origin : "");
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
    setStorySituation("");
    setStoryAction("");
    setStoryOutcome("");
    setTestimonialQuote("");
    setTestimonialAttribution("");
    setTestimonialVideoUrl("");
    setReflection("");
    setEvidenceDrafts([]);
    setRecipientMode("contributor");
    setContributorId("");
    setRecipientName("");
    setSentProofId(null);
    setError(null);
  }

  if (sentProofId) {
    const proofUrl = `${sentOrigin}/proof/${sentProofId}`;
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(proofUrl)}`;

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pb-16 pt-8">
        <div className="flex items-center gap-3">
          <Link href="/ops" className="text-sm text-[var(--color-muted-foreground)] underline">
            ← Dashboard
          </Link>
        </div>
        <Card className="flex flex-col gap-3 text-center">
          <p className="text-lg font-semibold leading-snug">Proof of Act saved</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            This is a public link — anyone who has it can open it, no sign-in required. Send it to{" "}
            {recipientLabel || "the recipient"} yourself (e.g. WhatsApp); nothing was sent automatically.
          </p>
          <p className="break-all rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-foreground)]">
            {proofUrl}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <CopyLinkButton url={proofUrl} />
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button variant="primary" className="w-full">
                Share via WhatsApp
              </Button>
            </a>
          </div>
          <Link href={`/proof/${sentProofId}`} target="_blank" className="text-sm text-[var(--color-primary)] underline">
            View it as they&apos;ll see it →
          </Link>
          <Button className="mt-1 w-full" variant="secondary" onClick={handleSendAnother}>
            Create another
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
          Manually record an act and get a public link to share yourself (e.g. WhatsApp). This doesn&apos;t need to be a
          published Act already in the app — the entered details are what gets shown, with no Verified badge or claim.
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

          <ActProofMediaUpload
            label="Photo (optional)"
            accept="image/*"
            maxSizeMb={8}
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            kind="image"
          />
        </Card>
      </section>

      <section>
        <SectionHeader title="Story (optional)" />
        <Card className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Fill in all three to show a Story section on the proof — leave any one blank and it won&apos;t appear.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Situation
            <textarea value={storySituation} onChange={(e) => setStorySituation(e.target.value)} rows={2} className={`${inputClass()} resize-none`} placeholder="What was the problem or need" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Action
            <textarea value={storyAction} onChange={(e) => setStoryAction(e.target.value)} rows={2} className={`${inputClass()} resize-none`} placeholder="What was done" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Outcome
            <textarea value={storyOutcome} onChange={(e) => setStoryOutcome(e.target.value)} rows={2} className={`${inputClass()} resize-none`} placeholder="What happened as a result" />
          </label>
        </Card>
      </section>

      <section>
        <SectionHeader title="Testimonial (optional)" />
        <Card className="mt-3 flex flex-col gap-3">
          <ActProofMediaUpload
            label="Video (optional)"
            accept="video/mp4,video/quicktime,video/webm"
            maxSizeMb={60}
            value={testimonialVideoUrl}
            onChange={setTestimonialVideoUrl}
            kind="video"
          />
          <label className="flex flex-col gap-1 text-sm">
            Quote
            <textarea value={testimonialQuote} onChange={(e) => setTestimonialQuote(e.target.value)} rows={2} className={`${inputClass()} resize-none`} placeholder="Something said by someone involved" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Attribution <span className="text-[var(--color-muted-foreground)]">(optional)</span>
            <input value={testimonialAttribution} onChange={(e) => setTestimonialAttribution(e.target.value)} className={inputClass()} placeholder="e.g. Annai Aravindar Karunai Illam" />
          </label>
        </Card>
      </section>

      <section>
        <SectionHeader title="Evidence photos (optional)" />
        <Card className="mt-3 flex flex-col gap-4">
          {evidenceDrafts.map((draft, index) => (
            <div key={draft.key} className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
              <ActProofMediaUpload
                label={`Photo ${index + 1}`}
                accept="image/*"
                maxSizeMb={8}
                value={draft.photoUrl}
                onChange={(url) =>
                  setEvidenceDrafts((prev) => prev.map((d) => (d.key === draft.key ? { ...d, photoUrl: url } : d)))
                }
                kind="image"
              />
              <input
                value={draft.caption}
                onChange={(e) =>
                  setEvidenceDrafts((prev) => prev.map((d) => (d.key === draft.key ? { ...d, caption: e.target.value } : d)))
                }
                className={inputClass()}
                placeholder="Caption (optional)"
              />
              <button
                type="button"
                onClick={() => setEvidenceDrafts((prev) => prev.filter((d) => d.key !== draft.key))}
                className="self-start text-xs text-[var(--color-muted-foreground)] underline"
              >
                Remove photo
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setEvidenceDrafts((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, photoUrl: "", caption: "" }])}
          >
            Add a photo
          </Button>
        </Card>
      </section>

      <section>
        <SectionHeader title="Reflection (optional)" />
        <Card className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            What this act meant
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={3} className={`${inputClass()} resize-none`} placeholder="A personal reflection" />
          </label>
        </Card>
      </section>

      <section>
        <SectionHeader title="Recipient" />
        <Card className="mt-3 flex flex-col gap-3">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setRecipientMode("contributor")}
              className="rounded-[var(--radius-button)] border px-3 py-1.5"
              style={{
                borderColor: recipientMode === "contributor" ? "var(--color-primary)" : "var(--color-border)",
                color: recipientMode === "contributor" ? "var(--color-primary)" : "var(--color-muted-foreground)",
              }}
            >
              Contributor account
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode("name")}
              className="rounded-[var(--radius-button)] border px-3 py-1.5"
              style={{
                borderColor: recipientMode === "name" ? "var(--color-primary)" : "var(--color-border)",
                color: recipientMode === "name" ? "var(--color-primary)" : "var(--color-muted-foreground)",
              }}
            >
              Name only
            </button>
          </div>

          {recipientMode === "contributor" ? (
            <>
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
                A real contributor account, shown with their participation history as a sanity check before you confirm.
              </p>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm">
                Recipient name
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={inputClass()} placeholder="e.g. a volunteer without an app account" />
              </label>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                For someone without a contributor account. The link is still public once created — sharing it is on you.
              </p>
            </>
          )}
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
            storySituation={storySituation || null}
            storyAction={storyAction || null}
            storyOutcome={storyOutcome || null}
            testimonialQuote={testimonialQuote || null}
            testimonialAttribution={testimonialAttribution || null}
            testimonialVideoUrl={testimonialVideoUrl || null}
            reflection={reflection || null}
            evidence={evidenceDrafts.filter((d) => d.photoUrl).map((d) => ({ id: d.key, photoUrl: d.photoUrl, caption: d.caption || null }))}
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
        Review &amp; save
      </Button>

      <BottomSheet open={confirmOpen} onClose={() => !isPending && setConfirmOpen(false)}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-[var(--color-foreground)]">Confirm before saving</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              This creates a <span className="font-medium text-[var(--color-foreground)]">public link</span> for the proof
              below, addressed to{" "}
              <span className="font-medium text-[var(--color-foreground)]">{recipientLabel || "the recipient"}</span>.
              Nothing is sent automatically — you&apos;ll share the link yourself.
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
            storySituation={storySituation || null}
            storyAction={storyAction || null}
            storyOutcome={storyOutcome || null}
            testimonialQuote={testimonialQuote || null}
            testimonialAttribution={testimonialAttribution || null}
            testimonialVideoUrl={testimonialVideoUrl || null}
            reflection={reflection || null}
            evidence={evidenceDrafts.filter((d) => d.photoUrl).map((d) => ({ id: d.key, photoUrl: d.photoUrl, caption: d.caption || null }))}
          />

          {error && <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>}

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Back to edit
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleConfirmSend} disabled={isPending}>
              {isPending ? "Saving…" : "Confirm & save"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
