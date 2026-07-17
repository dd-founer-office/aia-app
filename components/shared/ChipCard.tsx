import Link from "next/link";
import type { ElementType } from "react";
import { IconBadge } from "@/components/shared/IconBadge";

interface ChipCardProps {
  href: string;
  icon: ElementType;
  label: string;
  value: string;
}

/**
 * 2-column grid tile, per the reference screenshot's Family/Zone/Colour/
 * Month pattern. The whole card is the tap target and navigates to a
 * dedicated detail page -- per explicit direction, every chip card
 * navigates to its own page rather than expanding inline.
 */
export function ChipCard({ href, icon, label, value }: ChipCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
    >
      <IconBadge icon={icon} />
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-[var(--color-muted-foreground)]">{value}</span>
      </span>
    </Link>
  );
}
