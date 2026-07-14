import { BottomNavigation } from "@/components/shared/BottomNavigation";

// Sprint 5.2 placeholder. Will later house Living Kolam + Aram Journey
// once the Practice Layer direction is validated and locked in Product OS.
export default function PracticePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-background)] px-6 text-center">
      <p className="text-lg font-semibold text-[var(--color-foreground)]">Practice</p>
      <p className="max-w-xs text-sm text-[var(--color-muted-foreground)]">
        Coming soon. This space will bring together your Living Kolam and Aram Journey.
      </p>
      <BottomNavigation active="practice" />
    </div>
  );
}
