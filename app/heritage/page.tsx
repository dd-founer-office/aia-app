import { BottomNavigation } from "@/components/shared/BottomNavigation";

// Sprint 5.2 placeholder. Intergenerational continuity experience — no
// functionality yet.
export default function HeritagePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-background)] px-6 text-center">
      <p className="text-lg font-semibold text-[var(--color-foreground)]">Heritage</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">Coming Soon.</p>
      <BottomNavigation active="heritage" />
    </div>
  );
}
