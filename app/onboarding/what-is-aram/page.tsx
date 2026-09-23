import { Fingerprint, Users, Infinity as InfinityIcon } from "lucide-react";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";

// CA-002 What is Aram -- the three Core Mission Pillars, quoted from the
// locked "00. Vision & Principles" doc (Identity / Belonging / Continuity).
const PILLARS = [
  {
    icon: Fingerprint,
    title: "Identity",
    description: "Helping people act in alignment with who they are, where they come from, and what they stand for.",
  },
  {
    icon: Users,
    title: "Belonging",
    description: "Helping people feel connected -- to family, community, and shared responsibility -- through participation, not performance.",
  },
  {
    icon: InfinityIcon,
    title: "Continuity",
    description: "Helping values and care persist over time through repeatable, documented, verified acts.",
  },
];

export default function OnboardingWhatIsAramPage() {
  return (
    <OnboardingScreen
      step={2}
      totalSteps={5}
      title="What is Aram?"
      subtitle="Aram anchors AiA in responsibility across time -- gratitude for what was carried to you, and stewardship for what you leave behind."
      continueHref="/onboarding/how-it-works"
      backHref="/onboarding/welcome"
      skipHref="/sign-in"
    >
      {PILLARS.map((pillar) => {
        const Icon = pillar.icon;
        return (
          <div
            key={pillar.title}
            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          >
            <Icon aria-hidden="true" className="h-7 w-7 shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} />
            <div>
              <p className="text-base font-medium text-[var(--color-foreground)]">{pillar.title}</p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{pillar.description}</p>
            </div>
          </div>
        );
      })}
    </OnboardingScreen>
  );
}
