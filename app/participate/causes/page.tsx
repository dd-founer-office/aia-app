"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CauseCard } from "@/components/shared/CauseCard";
import { PrimaryButton } from "@/components/shared/PrimaryButton";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { useParticipationFlow } from "@/lib/participation-flow-context";
import { CAUSES } from "@/types/participation";

// Total steps that will actually render for this contributor this month.
// At MVP, Choose Participation Method auto-skips (only Financial
// Contribution is enabled in the registry), so the visible flow is:
// Causes -> Method Details -> Review -> Confirmation -> Success = 5 steps.
// This must stay derived from what renders, not the 6-step architectural
// skeleton (CA-014A UX spec §10 self-review).
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
    <main className="mx-auto flex min-h-svh w-full max-w-[800px] flex-col px-5">
      <div className="mt-6">
        <ProgressIndicator current={1} total={VISIBLE_STEP_COUNT} />
      </div>

      <ScreenHeader
        title="How would you like to express Aram this month?"
        subtitle="Choose one or more causes close to your heart."
      />

      <div className="mt-8 flex flex-1 flex-col gap-3 pb-32">
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
          className={[
            "text-[13px] font-sans text-(--color-amber) transition-opacity duration-150",
            showValidation ? "opacity-100" : "opacity-0 h-0 overflow-hidden",
          ].join(" ")}
        >
          Select at least one cause to continue.
        </p>
      </div>

      <div className="sticky bottom-0 w-full bg-(--color-aia-background)/95 backdrop-blur-sm py-4">
        <PrimaryButton onClick={handleContinue} disabled={!hasSelection}>
          Continue
        </PrimaryButton>
      </div>
    </main>
  );
}
