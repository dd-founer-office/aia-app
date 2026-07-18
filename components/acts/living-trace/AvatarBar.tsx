"use client";

import { ChevronLeft, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface AvatarBarProps {
  item: EvidenceTraceItem;
  onExpand: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

/**
 * Bottom "captured by" bar -- replaces the floating Trust Card per
 * explicit reference (avatar + name + prev/next in one floating
 * capsule). Solid card background, no glass/blur. Colour stays
 * status-only (the small verified check), never category, per Visual
 * Constitution §8. Center tap expands the full map for map-kind trust
 * data; disabled (no-op) for info-kind (school/support-partner privacy
 * cases), since there's no location to reveal.
 */
export function AvatarBar({ item, onExpand, onPrev, onNext, canPrev, canNext }: AvatarBarProps) {
  const { trust } = item;
  const subtitle = trust.kind === "map" ? trust.locationLabel : trust.infoValue;
  const expandable = trust.kind === "map";

  return (
    <div className="mx-auto flex w-[88%] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-2 pr-2 shadow-sm">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous evidence"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        type="button"
        onClick={expandable ? onExpand : undefined}
        disabled={!expandable}
        className="flex flex-1 items-center gap-2.5 overflow-hidden text-left disabled:cursor-default"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-primary-dark)]">
          <UserRound size={16} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1 truncate text-sm font-medium">
            {item.capturedBy}
            {trust.verificationStatus === "verified" && (
              <ShieldCheck size={12} style={{ color: "var(--color-success)" }} />
            )}
          </span>
          <span className="truncate text-xs text-[var(--color-muted-foreground)]">
            {item.captureDate} · {subtitle}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="Next evidence"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
