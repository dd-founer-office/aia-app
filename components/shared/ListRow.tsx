import type { ElementType, ReactNode } from "react";
import { IconBadge } from "@/components/shared/IconBadge";

/**
 * Icon badge + label/value pair, thin divider between rows, grouped inside
 * one Card. Promoted to shared/ from ActDetailClient.tsx now that the
 * Verification and Records detail pages need it too.
 */
export function ListRow({
  icon,
  label,
  value,
  trailing,
  isLast,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
  trailing?: ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={!isLast ? { borderBottom: "1px solid var(--color-border)" } : undefined}
    >
      <IconBadge icon={icon} />
      <div className="flex flex-1 flex-col">
        <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
      {trailing}
    </div>
  );
}
