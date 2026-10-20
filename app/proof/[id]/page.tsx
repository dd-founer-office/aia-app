import { notFound } from "next/navigation";
import Link from "next/link";
import { getActProofForViewer } from "@/lib/act-proofs";
import { ActProofCard } from "@/components/acts/ActProofCard";
import { CAUSES } from "@/types/participation";

function formatDateDisplay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// Proof of Act's public viewer -- a deliberately shareable, unlisted link
// (see lib/act-proofs.ts's own comment on getActProofForViewer). No
// sign-in check: this is reached from a link the operator pastes
// somewhere themselves (e.g. WhatsApp), not from an in-app notification.
export default async function ProofOfActViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proof = await getActProofForViewer(id);
  if (!proof) notFound();

  const causeTitle = CAUSES.find((c) => c.title === proof.cause)?.title ?? proof.cause;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pb-16 pt-6">
      <Link href="/" className="text-sm text-[var(--color-muted-foreground)] underline">
        ← Home
      </Link>

      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
          A moment shared with you
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Recorded by AiA and shared with you personally.
        </p>
      </div>

      <ActProofCard
        actTitle={proof.actTitle}
        actDateDisplay={formatDateDisplay(proof.actDateIso)}
        cause={causeTitle}
        organization={proof.organization}
        landmark={proof.landmark}
        description={proof.description}
        outcomeSummary={proof.outcomeSummary}
        heroImageUrl={proof.heroImageUrl}
        storySituation={proof.storySituation}
        storyAction={proof.storyAction}
        storyOutcome={proof.storyOutcome}
        testimonialQuote={proof.testimonialQuote}
        testimonialAttribution={proof.testimonialAttribution}
        reflection={proof.reflection}
        recipientName={proof.recipientName ?? "you"}
        createdByName={proof.createdByName}
        createdAtDisplay={formatCreatedAt(proof.createdAtIso)}
      />
    </div>
  );
}
