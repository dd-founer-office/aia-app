import type { ElementType } from "react";

/**
 * Small circular badge, light tint background, icon in primary green.
 * Per Visual Constitution v1.1 §"New Patterns Added". Promoted to shared/
 * from its original home inside ActDetailClient.tsx now that ChipCard and
 * the new detail sub-pages need it too.
 */
export function IconBadge({ icon: Icon }: { icon: ElementType }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: "var(--color-badge-verified-bg)" }}
    >
      <Icon size={16} style={{ color: "var(--color-primary)" }} />
    </span>
  );
}
