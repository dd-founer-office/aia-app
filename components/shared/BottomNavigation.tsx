import Link from "next/link";
import { Home as HomeIcon, BookOpen, Sprout, User as UserIcon } from "lucide-react";

export type NavTab = "home" | "acts" | "journey" | "profile";

export interface BottomNavigationProps {
  active: NavTab;
}

const TABS: { id: NavTab; label: string; Icon: typeof HomeIcon; href: string | null }[] = [
  { id: "home", label: "Home", Icon: HomeIcon, href: "/" },
  { id: "acts", label: "Acts", Icon: BookOpen, href: "/acts" },
  { id: "journey", label: "Journey", Icon: Sprout, href: null },
  { id: "profile", label: "Profile", Icon: UserIcon, href: null },
];

/**
 * Shared BottomNavigation primitive.
 * Extracted from Home Screen's inline <nav> + NavItem function.
 *
 * Icon mapping corrected per locked decision (AiA-Design-System-v1-LOCKED.md):
 * Home screen's live code had Acts=Sparkles, Journey=BookOpen — this was
 * found to contradict the approved nav screenshot (Home/BookOpen/Sprout/User)
 * during extraction. The locked spec wins; corrected here to
 * Acts=BookOpen, Journey=Sprout.
 *
 * Exactly 4 tabs per Visual Constitution §9 (max 5, mobile-first, labels
 * always visible). Home (/) and Acts (/acts) are real routes and are
 * wired with next/link. Journey and Profile render as inactive until
 * CA-012 and CA-013 are built (per Sprint 1 backlog) — this is intended
 * behavior, not a regression.
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto flex max-w-md justify-between px-6 py-3">
        {TABS.map(({ id, label, Icon, href }) => {
          const content = (
            <div
              className={`flex flex-col items-center gap-1 ${
                id === active ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs">{label}</span>
            </div>
          );

          return href ? (
            <Link key={id} href={href} aria-label={label}>
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
