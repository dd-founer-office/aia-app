import type { CSSProperties, ReactElement } from "react";
import { STAGE_EPITHETS, STAGE_LABELS, STAGE_MEANINGS, type StageName } from "@/types";
import { Card } from "@/components/shared/Card";
import { VidhaiSeedIcon } from "@/components/home/icons/VidhaiSeedIcon";
import { ThulirSproutIcon } from "@/components/home/icons/ThulirSproutIcon";
import { KandruSaplingIcon } from "@/components/home/icons/KandruSaplingIcon";
import { MaramTreeIcon } from "@/components/home/icons/MaramTreeIcon";
import { VanamForestIcon } from "@/components/home/icons/VanamForestIcon";

type StageIconComponent = (props: { style?: CSSProperties; className?: string }) => ReactElement;

const STAGE_ICONS: Record<StageName, StageIconComponent> = {
  vidhai: VidhaiSeedIcon,
  thulir: ThulirSproutIcon,
  kandru: KandruSaplingIcon,
  maram: MaramTreeIcon,
  vanam: VanamForestIcon,
};

export interface JourneyHeroProps {
  currentStage: StageName;
  continuityMonthCount: number;
  lifetimeParticipationCount: number;
}

/** CA-012 Section 1 -- Journey Hero. "Identity first; numbers support
 *  identity, never lead" (locked rule) -- stage name/meaning render above
 *  the continuity/participation counts, not beside or before them. */
export function JourneyHero({
  currentStage,
  continuityMonthCount,
  lifetimeParticipationCount,
}: JourneyHeroProps) {
  const Icon = STAGE_ICONS[currentStage];
  const label = STAGE_LABELS[currentStage];

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        <Icon style={{ height: "28px", width: "auto" }} />
      </div>
      <div>
        <p className="font-tamil-sans text-2xl font-medium leading-tight text-[var(--color-foreground)]">
          {label.ta} <span className="font-display font-normal">{"•"} {label.en}</span>
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">
          {STAGE_EPITHETS[currentStage]}
        </p>
        <p className="mt-2 max-w-xs text-sm text-[var(--color-muted-foreground)]">
          {STAGE_MEANINGS[currentStage]}
        </p>
      </div>
      <div className="mt-2 flex w-full justify-center gap-10 border-t border-[var(--color-border)] pt-4">
        <div className="text-center">
          <p className="text-base font-medium text-[var(--color-foreground)]">
            {continuityMonthCount} month{continuityMonthCount === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Current continuity</p>
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-[var(--color-foreground)]">
            {lifetimeParticipationCount}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Lifetime participations</p>
        </div>
      </div>
    </Card>
  );
}
