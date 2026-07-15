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

const TABS: { id: NavTab; Icon: LucideIcon; href: string | null }[] = [
  { id: "home", Icon: HomeIcon, href: "/" },
  { id: "acts", Icon: LayoutList, href: "/acts" },
  { id: "practice", Icon: HomeIcon, href: "/practice" }, // rendered separately as the floating button
  { id: "heritage", Icon: InfinityIcon, href: "/heritage" },
  { id: "profile", Icon: UserIcon, href: null },
];

/**
 * Sprint 5.2 — Shell UI exploration branch (UI-only, reversible).
 * Docked (non-floating) notched bottom bar with a true 5-column grid so
 * icon spacing is symmetric. Only the center Practice button floats,
 * seated in a cutout carved into the bar's top edge.
 * NOTE: no-label treatment still deviates from Visual Constitution §9
 * ("Labels always visible") — flagged previously, proceeding per
 * explicit direction.
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    // Transparent wrapper — critical so the SVG notch cutout actually
    // reveals the page background instead of matching card-white.
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-transparent pb-[env(safe-area-inset-bottom)]">
      <div className="relative w-full max-w-md">
        {/* Notched bar background */}
        <svg viewBox="0 0 400 64" preserveAspectRatio="none" className="block h-16 w-full">
          <path
            d="M0 20 C0 8.954 8.954 0 20 0 H150 C165 0 168 26 200 26 C232 26 235 0 250 0 H380 C391.046 0 400 8.954 400 20 V64 H0 V20 Z"
            fill="var(--color-card)"
          />
        </svg>

        {/* Icon row — true 5-column grid, center column reserved for notch */}
        <div className="absolute inset-x-0 bottom-3 grid grid-cols-5 items-end px-2">
          {TABS.map(({ id, Icon, href }) =>
            id === "practice" ? (
              <div key={id} />
            ) : (
              <NavItem key={id} id={id} Icon={Icon} href={href} isActive={id === active} />
            )
          )}
        </div>

        {/* Floating center button — Practice */}
        <Link
          href="/practice"
          aria-label="practice"
          className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] transition-transform duration-[180ms] ease-out active:scale-90"
          style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.20)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/aia-kolam-mark.png"
            alt="AiA"
            className="h-8 w-8"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>

        {active === "practice" && (
          <span className="absolute left-1/2 top-[46px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--color-primary)]" />
        )}
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
