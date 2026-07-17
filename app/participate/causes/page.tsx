"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { CauseCard } from "@/components/shared/CauseCard";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { useParticipationFlow } from "@/lib/participation-flow-context";
import { CAUSES } from "@/types/participation";

const VISIBLE_STEP_COUNT = 5;

export default function ChooseCausesPage() {
  const router = useRouter();
  const { state, toggleCause } = useParticipationFlow();
  const [showValidation, setShowValidation] = useState(false);

  const hasSelection = state.selectedCauses.length > 0;

  function handleContinue() {
    if (!hasSelection) {
      setShowValidation(true);
      return;
    }
    router.push("/participate/method-details");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-5 pt-10">
        <ProgressIndicator current={1} total={VISIBLE_STEP_COUNT} />
        <ScreenHeader
          title="How would you like to express Aram this month?"
          subtitle="Choose one or more causes close to your heart."
        />

        <div className="mt-6 flex flex-1 flex-col gap-3 pb-32">
          {CAUSES.map((cause) => (
            <CauseCard
              key={cause.id}
              cause={cause}
              selected={state.selectedCauses.includes(cause.id)}
              onToggle={() => {
                if (showValidation) setShowValidation(false);
                toggleCause(cause.id);
              }}
            />
          ))}

          <p
            role="status"
            aria-live="polite"
            className={`text-xs text-[var(--color-muted-foreground)] transition-opacity ${
              showValidation ? "opacity-100" : "h-0 opacity-0 overflow-hidden"
            }`}
          >
            Select at least one cause to continue.
          </p>
        </div>

        <div className="sticky bottom-0 w-full bg-[var(--color-background)] py-4">
          <Button
            className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!hasSelection}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </main>
    </div>
  );
}
