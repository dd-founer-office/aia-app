import { Home as HomeIcon, BookOpen, Sprout, User as UserIcon } from "lucide-react";

export type NavTab = "home" | "acts" | "journey" | "profile";

export interface BottomNavigationProps {
  active: NavTab;
}

const TABS: { id: NavTab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "acts", label: "Acts", Icon: BookOpen },
  { id: "journey", label: "Journey", Icon: Sprout },
  { id: "profile", label: "Profile", Icon: UserIcon },
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
 * always visible). Only Home is currently a real route; the other three
 * render as inactive until their screens are built (per Home's original
 * comment — preserved behavior, not a regression).
 */
export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto flex max-w-md justify-between px-6 py-3">
        {TABS.map(({ id, label, Icon }) => (
          <div
            key={id}
            className={`flex flex-col items-center gap-1 ${
              id === active ? "text-[var(--color-primary)]" : "text-[var(--color-inactive)]"
            }`}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
