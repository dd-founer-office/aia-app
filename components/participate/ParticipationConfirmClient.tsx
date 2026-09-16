"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { ParticipationSummaryCard } from "./ParticipationSummaryCard";
import { useParticipationFlow } from "@/lib/participation-flow-context";
import { recordParticipationAction } from "@/lib/participation-actions";

interface ParticipationConfirmClientProps {
  stageLabel: string;
  continuityMonthCount: number;
  monthLabel: string;
}

export function ParticipationConfirmClient({
  stageLabel,
  continuityMonthCount,
  monthLabel,
}: ParticipationConfirmClientProps) {
  const router = useRouter();
  const { state, resetSelection } = useParticipationFlow();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // See ParticipationSummaryClient's identical guard for why this can't
  // just branch on state.selectedCauses directly: that value is already
  // correct on this component's very first CLIENT render (read
  // synchronously from sessionStorage), but the server's render of that
  // same first paint never had access to it -- branching output on it
  // before hydration completes is a real hydration mismatch, not a nit.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && state.selectedCauses.length === 0) router.replace("/participate/causes");
  }, [mounted, state.selectedCauses, router]);

  async function handleRecord() {
    setSubmitting(true);
    setError(null);
    const result = await recordParticipationAction(state.selectedCauses);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    resetSelection();
    router.push("/participate/recorded");
  }

  if (!mounted || state.selectedCauses.length === 0) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-5 pt-10">
        <ProgressIndicator current={3} total={4} />
        <ScreenHeader title="Confirmation" subtitle="Commit your participation." />

        <div className="mt-6 flex flex-1 flex-col gap-4 pb-32">
          <ParticipationSummaryCard
            selectedCauseIds={state.selectedCauses}
            monthLabel={monthLabel}
            stageLabel={stageLabel}
            continuityMonthCount={continuityMonthCount}
          />

          <label className="flex items-start gap-3 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            />
            <span>
              I understand that AiA will identify and execute verified opportunities within my
              selected causes during this month.
            </span>
          </label>

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <div className="sticky bottom-0 w-full bg-[var(--color-background)] py-4">
          <Button
            className="w-full disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!confirmed || submitting}
            onClick={handleRecord}
          >
            {submitting ? "Recording…" : "Record Participation"}
          </Button>
        </div>
      </main>
    </div>
  );
}
