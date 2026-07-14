"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Home as HomeIcon,
  BookOpen,
  Flower2,
  Landmark,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

export type NavTab = "home" | "acts" | "practice" | "heritage" | "profile";

export interface BottomNavigationProps {
  active: NavTab;
}

const TABS: {
  id: NavTab;
  label: string;
  Icon: LucideIcon;
  href: string | null;
  emphasized?: boolean;
}[] = [
  { id: "home", label: "Home", Icon: HomeIcon, href: "/" },
  { id: "acts", label: "Acts", Icon: BookOpen, href: "/acts" },
  // Placeholder icon — swap for the Living Kolam seed mark once available.
  { id: "practice", label: "Practice", Icon: Flower2, href: "/practice", emphasized: true },
  // Placeholder icon for the future intergenerational continuity experience.
  { id: "heritage", label: "Heritage", Icon: Landmark, href: "/heritage" },
  { id: "profile", label: "Profile", Icon: UserIcon, href: null },
];

/**
 * Sprint 5.2 — Shell UI exploration branch (UI-only, reversible).
 *
 * This supersedes the locked 4-tab nav (Home/Acts/Journey/Profile) for
 * design validation purposes only. Product OS / Screen Registry still
 * reflect the old spec until this direction is reviewed and formally
 * locked. No routing architecture, business logic, or domain models are
 * affected — "Practice" and "Heritage" are placeholder destinations.
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  const [pressedId, setPressedId] = useState<NavTab | null>(null);

  return (
    <nav className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex h-[76px] items-center gap-1 rounded-full bg-[var(--color-card)] px-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {TABS.map(({ id, label, Icon, href, emphasized }) => {
          const isActive = id === active;
          const isPressed = pressedId === id;

          const content = (
            <div
              className={`flex flex-col items-center justify-center gap-1 rounded-full transition-transform duration-[180ms] ease-out ${
                emphasized
                  ? "h-14 w-14 -translate-y-2 bg-[var(--color-primary)]/10"
                  : "h-12 w-12"
              } ${isPressed ? "scale-90" : "scale-100"}`}
              style={emphasized ? { boxShadow: "0 4px 8px rgba(0,0,0,0.10)" } : undefined}
            >
              <Icon
                size={emphasized ? 26 : 22}
                strokeWidth={2}
                className={isActive ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"}
              />
              <span
                className={`text-[10px] leading-none ${
                  isActive ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"
                }`}
              >
                {label}
              </span>
            </div>
          );

          const handlers = {
            onPointerDown: () => setPressedId(id),
            onPointerUp: () => setPressedId(null),
            onPointerLeave: () => setPressedId(null),
          };

          return href ? (
            <Link key={id} href={href} aria-label={label} {...handlers}>
              {content}
            </Link>
          ) : (
            <div key={id} aria-disabled="true" {...handlers}>
              {content}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
