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

// Notch path traced directly from the reference screenshot's pixel geometry
// (button + bar profile measured and scaled to a 64px button), not hand-tuned.
const NOTCH_PATH =
  "M0,56 C0,44.954 8.954,36 20,36 H89.27 L89.27,36.0 L90.02,36.0 L90.78,36.0 L91.53,36.0 L92.28,36.0 L93.04,36.0 L93.79,36.0 L94.54,36.0 L95.29,36.0 L96.05,36.0 L96.8,36.0 L97.55,36.0 L98.31,36.0 L99.06,36.0 L99.81,36.0 L100.56,36.0 L101.32,36.0 L102.07,36.0 L102.82,36.0 L103.58,36.0 L104.33,36.0 L105.08,36.0 L105.84,36.0 L106.59,36.0 L107.34,36.0 L108.09,36.0 L108.85,36.0 L109.6,36.0 L110.35,36.0 L111.11,36.0 L111.86,36.0 L112.61,36.0 L113.36,36.0 L114.12,36.0 L114.87,36.0 L115.62,36.0 L116.38,36.0 L117.13,36.0 L117.88,36.0 L118.64,36.0 L119.39,36.0 L120.14,36.0 L120.89,36.0 L121.65,36.0 L122.4,36.75 L123.15,36.75 L123.91,36.75 L124.66,36.75 L125.41,37.51 L126.16,37.51 L126.92,37.51 L127.67,37.51 L128.42,38.26 L129.18,39.01 L129.93,39.01 L130.68,39.76 L131.44,40.52 L132.19,41.27 L132.94,42.02 L133.69,42.78 L134.45,43.53 L135.2,44.28 L135.95,45.79 L136.71,47.29 L137.46,47.29 L138.21,48.8 L138.96,50.31 L139.72,51.06 L140.47,52.56 L141.22,54.82 L141.98,56.33 L142.73,57.84 L143.48,59.34 L144.24,60.85 L144.99,62.35 L145.74,62.35 L146.49,63.86 L147.25,65.36 L148.0,66.87 L148.75,68.38 L149.51,69.13 L150.26,69.88 L151.01,70.64 L151.76,71.39 L152.52,71.39 L153.27,72.14 L154.02,72.89 L154.78,73.65 L155.53,75.15 L156.28,75.91 L157.04,76.66 L157.79,76.66 L158.54,77.41 L159.29,77.41 L160.05,78.16 L160.8,78.16 L161.55,78.16 L162.31,78.16 L163.06,78.16 L163.81,78.16 L164.56,78.16 L165.32,78.92 L166.07,79.67 L166.82,79.67 L167.58,79.67 L168.33,80.42 L169.08,80.42 L169.84,80.42 L170.59,80.42 L171.34,80.42 L172.09,80.42 L172.85,80.42 L173.6,81.18 L174.35,81.18 L175.11,81.18 L175.86,81.18 L176.61,81.18 L177.36,81.93 L178.12,81.93 L178.87,81.93 L179.62,81.18 L180.38,81.18 L181.13,81.18 L181.88,81.93 L182.64,81.93 L183.39,81.93 L184.14,81.93 L184.89,81.93 L185.65,81.18 L186.4,81.18 L187.15,80.42 L187.91,80.42 L188.66,80.42 L189.41,80.42 L190.16,80.42 L190.92,80.42 L191.67,79.67 L192.42,79.67 L193.18,79.67 L193.93,79.67 L194.68,78.92 L195.44,78.92 L196.19,78.16 L196.94,78.16 L197.69,77.41 L198.45,77.41 L199.2,77.41 L199.95,76.66 L200.71,75.91 L201.46,75.91 L202.21,75.15 L202.96,75.15 L203.72,75.15 L204.47,74.4 L205.22,73.65 L205.98,72.89 L206.73,71.39 L207.48,70.64 L208.24,69.88 L208.99,69.13 L209.74,68.38 L210.49,66.87 L211.25,65.36 L212.0,63.86 L212.75,62.35 L213.51,61.6 L214.26,60.85 L215.01,60.09 L215.76,57.84 L216.52,55.58 L217.27,54.82 L218.02,52.56 L218.78,50.31 L219.53,49.55 L220.28,48.05 L221.04,47.29 L221.79,46.54 L222.54,45.79 L223.29,45.04 L224.05,44.28 L224.8,42.78 L225.55,42.02 L226.31,41.27 L227.06,41.27 L227.81,39.76 L228.56,39.01 L229.32,39.01 L230.07,38.26 L230.82,38.26 L231.58,37.51 L232.33,37.51 L233.08,36.75 L233.84,36.75 L234.59,36.75 L235.34,36.75 L236.09,36.75 L236.85,36.75 L237.6,36.75 L238.35,36.75 L239.11,36.75 L239.86,36.0 L240.61,36.0 L241.36,36.0 L242.12,36.0 L242.87,36.0 L243.62,36.0 L244.38,36.0 L245.13,36.0 L245.88,36.0 L246.64,36.0 L247.39,36.0 L248.14,36.0 L248.89,36.0 L249.65,36.0 L250.4,36.0 L251.15,36.0 L251.91,36.0 L252.66,36.0 L253.41,36.0 L254.16,36.0 L254.92,36.0 L255.67,36.0 L256.42,36.0 L257.18,36.0 L257.93,36.0 L258.68,36.0 L259.44,36.0 L260.19,36.0 L260.94,36.0 L261.69,36.0 L262.45,36.0 L263.2,36.0 L263.95,36.0 L264.71,36.0 L265.46,36.0 L266.21,36.0 L266.96,36.0 L267.72,36.0 L268.47,36.0 L269.22,36.0 L269.98,36.0 L270.73,36.0 L271.48,36.0 L272.24,36.0 L272.99,36.0 H340 C351.046,36 360,44.954 360,56 V100 H0 V56 Z";

/**
 * Sprint 5.2 — Shell UI exploration branch (UI-only, reversible).
 * Fixed/docked (non-floating) notched bottom bar; only the center button
 * floats. Notch geometry traced from the design reference, not hand-tuned.
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
          className="absolute left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-primary)] transition-transform duration-[180ms] ease-out active:scale-90"
          style={{ top: 41.65, boxShadow: "0 6px 16px rgba(0,0,0,0.20)" }}
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
