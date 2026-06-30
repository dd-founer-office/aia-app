import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared Card primitive.
 * Extracted from the repeated card pattern in Home Screen (hero, this-month,
 * latest-act, shared-acts sections all used the same className by hand).
 * Padding corrected from the Home Screen's original p-4 (16px) to the locked
 * 20px per AiA-Design-System-v1-LOCKED.md — Visual Constitution names 20px
 * as a deliberate named exception to the 8pt grid, not 16px.
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
