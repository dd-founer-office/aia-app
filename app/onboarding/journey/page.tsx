import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { STAGE_ORDER, STAGE_LABELS, STAGE_EPITHETS, STAGE_MEANINGS } from "@/types";

// CA-005 Journey Introduction -- the 5 canonical Stages of Aram, reusing
// the same locked constants CA-012 Aram Journey renders from (never a
// second copy of this copy). Final step of onboarding: Continue leads into
// CA-006 Signup (the enhanced /sign-in screen), matching the locked
// Onboarding Flow's "Create Account" step.
export default function OnboardingJourneyPage() {
  return (
    <OnboardingScreen
      step={5}
      totalSteps={5}
      title="Your Aram Journey"
      subtitle="Progress through participation, not contribution size."
      continueHref="/sign-in"
      continueLabel="Create your account"
      backHref="/onboarding/causes"
    >
      {STAGE_ORDER.map((stage) => {
        const label = STAGE_LABELS[stage];
        return (
          <div
            key={stage}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              {label.emoji}
            </span>
            <div>
              <p className="text-base font-medium text-[var(--color-foreground)]">
                {label.en} ({label.ta}) -- {STAGE_EPITHETS[stage]}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{STAGE_MEANINGS[stage]}</p>
            </div>
          </div>
        );
      })}
    </OnboardingScreen>
  );
}
