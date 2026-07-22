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
    // NOTE: bg-[var(--color-background)] intentionally removed from this
    // root wrapper -- body already carries this exact background color
    // (globals.css), so this class was a redundant duplicate paint that
    // silently hid the Living Field's ambient canvas. Same fix as
    // app/page.tsx (Sprint 01 Foundation Completion).
    //
    // The STICKY FOOTER below (bottom of this file) INTENTIONALLY KEEPS
    // its own bg-[var(--color-background)] -- see the comment there. That
    // is a deliberate exception, not an oversight.
    <div className="flex min-h-screen flex-col">
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

        {/* INTENTIONALLY OPAQUE -- Living Field Foundation Completion v1.0,
            Part 1 exception. This is a sticky CTA bar pinned to the
            viewport bottom while the cause list scrolls underneath it. If
            it were transparent, scrolling cause cards (and/or Living Field
            letters) would visibly slide through/behind the pinned button,
            which reads as a rendering bug, not atmosphere. Kept opaque for
            functional legibility during scroll -- not an oversight. */}
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
