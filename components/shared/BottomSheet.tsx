import type { ReactNode } from "react";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Shared BottomSheet primitive — modal sheet per
 * AiA-Design-System-v1-LOCKED.md §4. Not present in Home Screen; built
 * fresh from the locked spec for the Participation Flow's confirmation
 * step (CA-014/CA-015 in the Screen Registry).
 */
export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/15"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[20px] border border-[var(--color-border)] bg-[var(--color-card)] px-5 pb-5 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[var(--color-border)]" />
        {children}
      </div>
    </div>
  );
}
