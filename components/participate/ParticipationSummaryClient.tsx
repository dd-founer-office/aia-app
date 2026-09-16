"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { ParticipationSummaryCard } from "./ParticipationSummaryCard";
import { useParticipationFlow } from "@/lib/participation-flow-context";

interface ParticipationSummaryClientProps {
  stageLabel: string;
  continuityMonthCount: number;
  monthLabel: string;
}

export function ParticipationSummaryClient({
  stageLabel,
  continuityMonthCount,
  monthLabel,
}: ParticipationSummaryClientProps) {
  const router = useRouter();
  const { state } = useParticipationFlow();

  // ParticipationFlowProvider's selectedCauses reads sessionStorage
  // synchronously in a useState lazy initializer (deliberate -- see that
  // file's own comment -- so Step 1 never flashes empty on a return visit).
  // That means it's already correct on this component's very FIRST client
  // render, before hydration completes -- but the server never had access
  // to sessionStorage, so server output for that same first render is
  // always the empty-selection case. Branching this component's rendered
  // OUTPUT on selectedCauses before hydration finishes would make client
  // and server disagree on that first paint (a real hydration-mismatch
  // bug, not just a lint nit). `mounted` starts false identically in both
  // environments and only flips true in an effect (post-hydration,
  // client-only), so the gated branch below only ever affects rendering
  // AFTER hydration has already reconciled -- one render is briefly blank
  // everywhere, matching exactly, rather than a mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Defensive: nothing selected means this page was reached directly (a
  // fresh tab, a stale bookmark) rather than via Step 1 -- send back there
  // instead of rendering an empty summary. No amount yet means Step 2
  // (Enter Amount) was skipped -- send back there instead.
  useEffect(() => {
    if (!mounted) return;
    if (state.selectedCauses.length === 0) router.replace("/participate/causes");
    else if (!state.totalAmountRupees) router.replace("/participate/amount");
  }, [mounted, state.selectedCauses, state.totalAmountRupees, router]);

  if (!mounted || state.selectedCauses.length === 0 || !state.totalAmountRupees) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-5 pt-10">
        <ProgressIndicator current={3} total={5} />
        <ScreenHeader title="Participation Summary" subtitle="Review your participation." />

        <div className="mt-6 flex flex-1 flex-col gap-4 pb-32">
          <ParticipationSummaryCard
            selectedCauseIds={state.selectedCauses}
            causeAllocationsRupees={state.causeAllocationsRupees}
            totalAmountRupees={state.totalAmountRupees}
            monthLabel={monthLabel}
            stageLabel={stageLabel}
            continuityMonthCount={continuityMonthCount}
          />

          <p className="text-sm text-[var(--color-muted-foreground)]">
            Your participation will help AiA identify, verify and execute meaningful opportunities
            within the selected causes during this month.
          </p>
        </div>

        <div className="sticky bottom-0 w-full bg-[var(--color-background)] py-4">
          <Button className="w-full" onClick={() => router.push("/participate/confirm")}>
            Continue
          </Button>
        </div>
      </main>
    </div>
  );
}
