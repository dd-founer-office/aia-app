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

// True semicircle notch: button (r=32) centered exactly on the bar's flat
// edge, cut radius 34 (gap halved to 2px). Single SVG arc command.
const NOTCH_PATH =
  "M0,56 C0,44.954 8.954,36 20,36 H146 A34,34 0 0 1 214,36 H340 C351.046,36 360,44.954 360,56 V100 H0 V56 Z";

/**
 * Sprint 5.2 — Shell UI exploration branch (UI-only, reversible).
 * Fixed/docked (non-floating) notched bottom bar; only the center button
 * floats, centered exactly on the flat edge with a true semicircular cut.
 * NOTE: no-label treatment still deviates from Visual Constitution §9
 * ("Labels always visible") — flagged previously, proceeding per
 * explicit direction.
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-transparent pb-[env(safe-area-inset-bottom)]">
      <div className="relative w-full max-w-md" style={{ height: 100 }}>
        <svg width="100%" height="100" viewBox="0 0 360 100" preserveAspectRatio="none" className="absolute inset-0 block">
          <path d={NOTCH_PATH} fill="var(--color-card)" />
        </svg>

        <div className="absolute inset-x-0 bottom-[14px] grid grid-cols-5 items-end px-2">
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
          className="absolute left-1/2 top-9 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] transition-transform duration-[180ms] ease-out active:scale-90"
          style={{ boxShadow: "0 3px 8px rgba(0,0,0,0.18)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/aia-kolam-mark.png"
            alt="AiA"
            className="h-8 w-8"
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
