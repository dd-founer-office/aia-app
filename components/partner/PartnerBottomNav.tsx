"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/partner",
    label: "Home",
    icon: (
      <path d="M3 11l9-8 9 8M5 10v10h14V10" />
    ),
  },
  {
    href: "/partner/activities",
    label: "Activities",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
  },
  {
    href: "/partner/profile",
    label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
      </>
    ),
  },
] as const;

/** Deliberately just three tabs, no center FAB -- Mission Camera is
 *  reached contextually from an Activity, never as a standalone nav
 *  destination (Partner Portal = assignment/context, Mission Camera =
 *  execution/evidence capture; the two are never merged). */
export function PartnerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Partner navigation"
      className="flex flex-shrink-0 items-center justify-around px-3 py-2.5"
      style={{ background: "var(--pp-deep-teal)", paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/partner" ? pathname === "/partner" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className="flex min-w-[44px] flex-col items-center gap-1 px-4 py-1.5"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? "var(--pp-mint)" : "rgba(255,255,255,.55)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {tab.icon}
            </svg>
            <span className="text-[11px]" style={{ color: active ? "var(--pp-mint)" : "rgba(255,255,255,.55)", fontWeight: active ? 600 : 500 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
