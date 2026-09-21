import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";

// CA-001 Welcome -- first screen of the locked Onboarding Flow (Welcome ->
// What is Aram? -> How AiA Works -> Causes of Aram -> Journey Introduction
// -> Create Account -> First Participation, per "04. Contributor
// Experience"). Definition and mission line quoted verbatim from the
// locked "00. Vision & Principles" doc, not invented copy.
export default function OnboardingWelcomePage() {
  return (
    <OnboardingScreen
      step={1}
      totalSteps={5}
      title="Welcome to Aram in Action"
      subtitle="Help people live Aram through verified acts of impact."
      continueHref="/onboarding/what-is-aram"
      skipHref="/sign-in"
    >
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <p className="font-display text-lg leading-snug text-[var(--color-foreground)]">
          &ldquo;Do the right thing for the people who came before you and the people who come after
          you.&rdquo;
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">This is Aram.</p>
      </div>
    </OnboardingScreen>
  );
}
