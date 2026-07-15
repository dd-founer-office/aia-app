"use client";

import Link from "next/link";
import {
  LayoutList,
  Leaf,
  Sprout,
  Bookmark,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

export type NavTab = "home" | "acts" | "practice" | "heritage" | "profile";

export interface BottomNavigationProps {
  active: NavTab;
}

const TABS: { id: NavTab; Icon: LucideIcon; href: string | null }[] = [
  { id: "home", Icon: LayoutList, href: "/" },
  { id: "acts", Icon: Leaf, href: "/acts" },
  { id: "practice", Icon: Sprout, href: "/practice" }, // center, always emphasized
  { id: "heritage", Icon: Bookmark, href: "/heritage" },
  { id: "profile", Icon: UserIcon, href: null },
];

/**
 * Sprint 5.2 — Shell UI exploration branch (UI-only, reversible).
 * Restyled to reference: floating pill, no labels, dot indicator under
 * the active tab, center tab as a fixed elevated filled circle.
 * NOTE: no-label treatment deviates from Visual Constitution §9
 * ("Labels always visible") — flagged, proceeding per explicit direction.
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="relative flex h-[72px] w-full max-w-md items-end justify-between rounded-full bg-white px-6 pb-3 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
        {TABS.map(({ id, Icon, href }) => {
          const isCenter = id === "practice";
          const isActive = id === active;

          const content = (
            <div className="flex flex-col items-center justify-end gap-1.5">
              {isCenter ? (
                <div
                  className="-mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]"
                  style={{ boxShadow: "0 6px 14px rgba(0,0,0,0.18)" }}
                >
                  <Icon size={26} strokeWidth={2} className="text-white" />
                </div>
              ) : (
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={isActive ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"}
                />
              )}
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-[var(--color-primary)]" : "bg-transparent"
                }`}
              />
            </div>
          );

          return href ? (
            <Link key={id} href={href} aria-label={id}>
              {content}
            </Link>
          ) : (
            <div key={id} aria-disabled="true">
              {content}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
