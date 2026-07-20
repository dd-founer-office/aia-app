import type { CSSProperties, ReactElement } from "react";
import { STAGE_LABELS, STAGE_ORDER, type StageName } from "@/types";
import { Card } from "@/components/shared/Card";
import { VidhaiSeedIcon } from "./icons/VidhaiSeedIcon";
import { ThulirSproutIcon } from "./icons/ThulirSproutIcon";
import { KandruSaplingIcon } from "./icons/KandruSaplingIcon";
import { MaramTreeIcon } from "./icons/MaramTreeIcon";
import { VanamForestIcon } from "./icons/VanamForestIcon";

type StageIconComponent = (props: { style?: CSSProperties; className?: string }) => ReactElement;

const STAGE_ICONS: Record<StageName, StageIconComponent> = {
  vidhai: VidhaiSeedIcon,
  thulir: ThulirSproutIcon,
  kandru: KandruSaplingIcon,
  maram: MaramTreeIcon,
  vanam: VanamForestIcon,
};

export interface JourneyTimelineProps {
  currentStage: StageName;
}

/**
 * Journey Timeline -- replaces the old "Current Stage" summary card on Home.
 * Per UX Constitution Journey Philosophy: a story, not a progress bar.
 * No percentages, XP, or gamification -- only Current Stage, adjacent
 * milestones, and stages already passed, shown as a continuous timeline.
 *
 * Note: completed stages show "Completed" rather than a reached-on date.
 * The locked six-table Sprint 1 schema (see types/index.ts) has no
 * stage-reached-date field, so a specific date is not yet available from
 * any approved data source -- flagged for a future schema decision rather
 * than invented here.
 */
export function JourneyTimeline({ currentStage }: JourneyTimelineProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <Card className="flex flex-col">
      {STAGE_ORDER.map((stageName, index) => {
        const Icon = STAGE_ICONS[stageName];
        const label = STAGE_LABELS[stageName];
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isNext = index === currentIndex + 1;
        const isLast = index === STAGE_ORDER.length - 1;
        const isReached = isCompleted || isCurrent;

        const statusText = isCompleted
          ? "Completed"
          : isCurrent
          ? "You are here"
          : isNext
          ? "Next milestone"
          : "Future stage";

        return (
          <div key={stageName} className="flex items-start">
            <div className="flex w-16 shrink-0 flex-col items-center">
              {isCurrent ? (
                <div className="-my-2.5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                    <Icon style={{ height: "20px", width: "auto" }} />
                  </div>
                </div>
              ) : (
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    isReached
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "bg-[var(--color-skeleton)] text-[var(--color-primary)]"
                  }`}
                >
                  <Icon style={{ height: "20px", width: "auto" }} />
                </div>
              )}
              {!isLast && (
                <div
                  className={`mt-0.5 w-0.5 flex-1 min-h-[52px] ${
                    isCompleted ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                  }`}
                />
              )}
            </div>
            <div className={`pl-5 pt-1.5 ${isLast ? "" : "pb-10"}`}>
              <p className="font-tamil-serif text-xl font-semibold leading-tight text-[var(--color-foreground)]">
                {label.ta}{" "}
                <span className="font-display font-normal">
                  {"\u2022"} {label.en}
                </span>
              </p>
              <p
                className={`mt-1.5 text-sm ${
                  isCurrent
                    ? "font-medium text-[var(--color-success)]"
                    : "text-[var(--color-muted-foreground)]"
                }`}
              >
                {statusText}
              </p>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
