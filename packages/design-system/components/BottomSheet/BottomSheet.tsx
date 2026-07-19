import type { ReactNode } from "react";
import { colors } from "../../tokens/colors";
import { zIndex } from "../../tokens/zIndex";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Ported from aia-app/components/shared/BottomSheet.tsx. */
export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: zIndex.modal,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.15)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "448px",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          padding: "16px 20px 20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            margin: "0 auto 12px",
            height: "4px",
            width: "36px",
            borderRadius: "9999px",
            backgroundColor: colors.border,
          }}
        />
        {children}
      </div>
    </div>
  );
}
