import { BottomNavigation } from "@/components/shared/BottomNavigation";

// Sprint 5.2 placeholder. Will later house Living Kolam + Aram Journey
// once the Practice Layer direction is validated and locked in Product OS.
//
// NOTE: bg-[var(--color-background)] intentionally removed from this root
// wrapper -- body already carries this exact background color
// (globals.css), so this class was a redundant duplicate paint that
// silently hid the Living Field's ambient canvas. Same fix as app/page.tsx
// (Sprint 01 Foundation Completion). No other change.
export default function PracticePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-lg font-semibold text-[var(--color-foreground)]">Practice</p>
      <p className="max-w-xs text-sm text-[var(--color-muted-foreground)]">
        Coming soon. This space will bring together your Living Kolam and Aram Journey.
      </p>
      <BottomNavigation active="practice" />
    </div>
  );
}
