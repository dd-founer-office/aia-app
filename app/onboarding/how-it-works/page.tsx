import { HandHeart, ShieldCheck, CalendarCheck, Eye } from "lucide-react";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";

// CA-003 How AiA Works -- four steps grounded in the locked Product
// Principles ("00. Vision & Principles"): Every Act of Aram Must Be
// Verified, Same-Month Execution, AiA Executes Contributor Intent, and
// Impact Assurance + Impact Documentation = Trust.
const STEPS = [
  {
    icon: HandHeart,
    title: "You participate",
    description: "Choose your causes and decide your own amount -- no plans, no tiers, no mandatory subscriptions.",
  },
  {
    icon: ShieldCheck,
    title: "AiA finds a verified opportunity",
    description: "Every Act of Aram is checked for Impact Assurance before AiA commits your participation to it.",
  },
  {
    icon: CalendarCheck,
    title: "AiA executes within the month",
    description: "Your intent is carried out the same month you participate -- not queued for later.",
  },
  {
    icon: Eye,
    title: "You see the verified Act",
    description: "Documentation and evidence are reviewed before publishing, so what you see is real.",
  },
];

export default function OnboardingHowItWorksPage() {
  return (
    <OnboardingScreen
      step={3}
      totalSteps={5}
      title="How AiA Works"
      subtitle="AiA executes your intent -- so you never have to chase, follow up, or wonder if it happened."
      continueHref="/onboarding/causes"
      backHref="/onboarding/what-is-aram"
      skipHref="/sign-in"
    >
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div
            key={step.title}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-badge-verified-bg)] text-xs font-medium text-[var(--color-primary-dark)]">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Icon aria-hidden="true" className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.75} />
                <p className="text-base font-medium text-[var(--color-foreground)]">{step.title}</p>
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{step.description}</p>
            </div>
          </div>
        );
      })}
    </OnboardingScreen>
  );
}
