"use client";

import { ChevronLeft, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface AvatarBarProps {
  item: EvidenceTraceItem;
  onExpand: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Bottom "captured by" bar -- replaces the floating Trust Card per
 * explicit reference. Solid card background, no glass/blur. Loops
 * infinitely alongside the card stack, so prev/next are always active.
 */
export function AvatarBar({ item, onExpand, onPrev, onNext }: AvatarBarProps) {
  const { trust } = item;
  const subtitle = trust.kind === "map" ? trust.locationLabel : trust.infoValue;
  const expandable = trust.kind === "map";

  return (
    <div className="mx-auto flex w-[88%] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-2 pr-2 shadow-sm">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous evidence"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)]"
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
        aria-label="Next evidence"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)]"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
