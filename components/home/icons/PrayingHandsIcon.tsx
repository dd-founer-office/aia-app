import type { SVGProps } from "react";

/**
 * Praying hands icon — used in the Home header greeting.
 * Built as a simplified stroke-based glyph using the exact same construction
 * as the Lucide icons used elsewhere in the app (24x24 viewBox, strokeWidth
 * 2, round caps/joins, no fill) so its line weight is literally identical to
 * the bottom navigation icons (Home, BookOpen, Sprout, User) at matching size.
 * Sized via `1em` height by default so it matches the surrounding text size
 * exactly; pass a className, size, or style to override.
 */
export function PrayingHandsIcon({
  style,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ height: "1em", width: "auto", ...style }}
      {...props}
    >
      <path d="M12 21 C9.3 19 7.7 16.3 7.7 12.8 C7.7 9 9 5.3 12 2.7 C15 5.3 16.3 9 16.3 12.8 C16.3 16.3 14.7 19 12 21 Z" />
      <path d="M12 4.2 L12 19.5" />
      <path d="M10.3 6 L11.3 5" />
      <path d="M13.7 6 L12.7 5" />
    </svg>
  );
}
