import { BookOpen, HeartPulse, Soup, TreePine } from "lucide-react";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { CAUSES } from "@/types/participation";

const ICONS = { BookOpen, HeartPulse, Soup, TreePine } as const;

// CA-004 Causes of Aram -- introduces the 4 locked causes before the real
// Participation Flow (CA-014) asks the contributor to choose among them.
// Deliberately read-only here (no selection state) -- reuses the same
// CAUSES data app/participate/causes/page.tsx selects from later, but not
// CauseCard itself, since that component's button/switch semantics imply
// an interaction this introductory screen doesn't offer.
export default function OnboardingCausesPage() {
  return (
    <OnboardingScreen
      step={4}
      totalSteps={5}
      title="Causes of Aram"
      subtitle="Every month, you choose which causes your participation expresses."
      continueHref="/onboarding/journey"
      backHref="/onboarding/how-it-works"
      skipHref="/sign-in"
    >
      {CAUSES.map((cause) => {
        const Icon = ICONS[cause.icon];
        return (
          <div
            key={cause.id}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <Icon aria-hidden="true" className="h-7 w-7 shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} />
            <div>
              <p className="text-base font-medium text-[var(--color-foreground)]">{cause.title}</p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{cause.description}</p>
            </div>
          </div>
        );
      })}
    </OnboardingScreen>
  );
}
