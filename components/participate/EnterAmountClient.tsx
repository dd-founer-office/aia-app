"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, HeartPulse, Soup, TreePine } from "lucide-react";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { useParticipationFlow } from "@/lib/participation-flow-context";
import { CAUSES, type CauseId } from "@/types/participation";

const ICONS = { BookOpen, HeartPulse, Soup, TreePine } as const;

/** Splits `total` whole rupees evenly across `ids`, giving the 1-rupee
 *  remainder to the first causes so the split always sums exactly to
 *  total (e.g. ₹100 across 3 causes -> 34/33/33, never 33.33 repeating). */
function equalSplit(total: number, ids: CauseId[]): Partial<Record<CauseId, number>> {
  if (ids.length === 0) return {};
  const base = Math.floor(total / ids.length);
  const remainder = total - base * ids.length;
  const result: Partial<Record<CauseId, number>> = {};
  ids.forEach((id, i) => {
    result[id] = base + (i < remainder ? 1 : 0);
  });
  return result;
}

export function EnterAmountClient() {
  const router = useRouter();
  const { state, setTotalAmountRupees, setCauseAllocationRupees } = useParticipationFlow();

  // Same hydration-safety gate as ParticipationSummaryClient/
  // ParticipationConfirmClient -- see those files for why this can't just
  // branch on state.selectedCauses directly on first render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && state.selectedCauses.length === 0) router.replace("/participate/causes");
  }, [mounted, state.selectedCauses, router]);

  const selectedCauses = CAUSES.filter((cause) => state.selectedCauses.includes(cause.id));
  const total = state.totalAmountRupees;

  function handleTotalChange(raw: string) {
    const parsed = raw === "" ? null : Math.max(0, Math.floor(Number(raw)));
    const amount = parsed !== null && Number.isFinite(parsed) ? parsed : null;
    setTotalAmountRupees(amount);
    // Changing the total resets the split to an even default across
    // currently selected causes -- the contributor can then adjust it
    // further below. Simpler and more predictable than trying to rescale
    // a stale custom split against a new total.
    if (amount !== null && amount > 0) {
      const split = equalSplit(amount, state.selectedCauses);
      state.selectedCauses.forEach((id) => setCauseAllocationRupees(id, split[id] ?? 0));
    }
  }

  const allocatedSum = state.selectedCauses.reduce(
    (sum, id) => sum + (state.causeAllocationsRupees[id] ?? 0),
    0
  );
  const remaining = (total ?? 0) - allocatedSum;
  const canContinue = total !== null && total > 0 && remaining === 0;

  if (!mounted || state.selectedCauses.length === 0) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-5 pt-10">
        <ProgressIndicator current={2} total={5} />
        <ScreenHeader
          title="Enter Amount"
          subtitle="Decide how much you'd like to participate with this month."
        />

        <div className="mt-6 flex flex-1 flex-col gap-4 pb-32">
          <Card className="flex flex-col gap-2">
            <label htmlFor="total-amount" className="text-sm font-medium text-[var(--color-foreground)]">
              Total amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-[var(--color-muted-foreground)]">₹</span>
              <input
                id="total-amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={total ?? ""}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0"
                className="w-full border-none bg-transparent text-2xl font-semibold text-[var(--color-foreground)] outline-none"
              />
            </div>
          </Card>

          {total !== null && total > 0 && (
            <Card className="flex flex-col gap-4">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Split across your selected causes
              </p>
              {selectedCauses.map((cause) => {
                const Icon = ICONS[cause.icon];
                return (
                  <div key={cause.id} className="flex items-center gap-3">
                    <Icon size={18} className="shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} />
                    <span className="flex-1 text-sm text-[var(--color-foreground)]">{cause.title}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-[var(--color-muted-foreground)]">₹</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={state.causeAllocationsRupees[cause.id] ?? 0}
                        onChange={(e) =>
                          setCauseAllocationRupees(
                            cause.id,
                            Math.max(0, Math.floor(Number(e.target.value)) || 0)
                          )
                        }
                        className="w-20 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-right text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                );
              })}

              <p
                className={`border-t border-[var(--color-border)] pt-3 text-sm ${
                  remaining === 0 ? "text-[var(--color-muted-foreground)]" : "text-[var(--color-error)]"
                }`}
              >
                {remaining === 0
                  ? `Allocated ₹${allocatedSum} of ₹${total}`
                  : remaining > 0
                    ? `₹${remaining} left to allocate`
                    : `₹${Math.abs(remaining)} over the total — reduce a cause's amount`}
              </p>
            </Card>
          )}
        </div>

        <div className="sticky bottom-0 w-full bg-[var(--color-background)] py-4">
          <Button
            className="w-full disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canContinue}
            onClick={() => router.push("/participate/summary")}
          >
            Continue
          </Button>
        </div>
      </main>
    </div>
  );
}
