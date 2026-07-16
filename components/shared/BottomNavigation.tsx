"use client";

import Link from "next/link";
import {
  Home as HomeIcon,
  LayoutList,
  Infinity as InfinityIcon,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

export type NavTab = "home" | "acts" | "practice" | "heritage" | "profile";

export interface BottomNavigationProps {
  active: NavTab;
}

const LEFT_TABS: { id: NavTab; Icon: LucideIcon; href: string | null }[] = [
  { id: "home", Icon: HomeIcon, href: "/" },
  { id: "acts", Icon: LayoutList, href: "/acts" },
];

const RIGHT_TABS: { id: NavTab; Icon: LucideIcon; href: string | null }[] = [
  { id: "heritage", Icon: InfinityIcon, href: "/heritage" },
  { id: "profile", Icon: UserIcon, href: null },
];

// Main notch: radius 35 (32 button + 3px gap), locked, unchanged.
// Corners where the flat edge meets the notch are now rounded with a
// 20px fillet — matching the bar's own outer corner radius exactly.
// Both the fillet arcs and the main arc were numerically verified to
// stay on the material side (y >= 36) before shipping this.
const NOTCH_PATH =
  "M0,56 C0,44.954 8.954,36 20,36 H128.77 A20,20 0 0 1 147.40,48.73 A35,35 0 0 0 212.60,48.73 A20,20 0 0 1 231.23,36 H340 C351.046,36 360,44.954 360,56 V100 H0 V56 Z";

/**
 * Sprint 5.2 — Shell UI exploration branch (UI-only, reversible).
 * Container uses a locked CSS aspect-ratio (360:100, matching the SVG
 * viewBox exactly) so the bar scales UNIFORMLY on every screen width —
 * previously width="100%" + fixed height stretched the circle into an
 * ellipse on phones wider than 360px. Button/icon positioning use
 * percentages so they scale in lockstep with the bar, not fixed px.
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-transparent pb-[env(safe-area-inset-bottom)]">
      <div className="relative w-full max-w-md" style={{ aspectRatio: "360 / 100" }}>
        <svg width="100%" height="100%" viewBox="0 0 360 100" className="absolute inset-0 block">
          <path d={NOTCH_PATH} fill="var(--color-card)" />
        </svg>

        <div
          className="absolute inset-x-0 grid grid-cols-5 items-end px-2"
          style={{ bottom: "14%" }}
        >
          {LEFT_TABS.map(({ id, Icon, href }) => (
            <NavItem key={id} id={id} Icon={Icon} href={href} isActive={id === active} />
          ))}
          <div />
          {RIGHT_TABS.map(({ id, Icon, href }) => (
            <NavItem key={id} id={id} Icon={Icon} href={href} isActive={id === active} />
          ))}
        </div>

        <Link
          href="/practice"
          aria-label="practice"
          className="absolute flex items-center justify-center rounded-full bg-[var(--color-primary)] transition-transform duration-[180ms] ease-out active:scale-90"
          style={{
            left: "50%",
            top: "36%",
            width: "17.78%",
            aspectRatio: "1 / 1",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/aia-kolam-mark.png"
            alt="AiA"
            className="h-[80%] w-[80%]"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>
    </nav>
  );
}

function NavItem({
  id,
  Icon,
  href,
  isActive,
}: {
  id: NavTab;
  Icon: LucideIcon;
  href: string | null;
  isActive: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center gap-1.5">
      <Icon
        size={22}
        strokeWidth={2}
        className={isActive ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"}
      />
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[var(--color-primary)]" : "bg-transparent"}`} />
    </div>
  );
  return href ? (
    <Link href={href} aria-label={id} className="flex justify-center">
      {content}
    </Link>
  ) : (
    <div aria-disabled="true" className="flex justify-center">
      {content}
    </div>
  );
}
