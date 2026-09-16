import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";

export interface PersonalReflectionSectionProps {
  reflectionLines: string[];
}

/** CA-012 Section 6 -- meaning, not scoring. Locked rules: reflection only,
 *  no scoring, no achievements, no badges. */
export function PersonalReflectionSection({ reflectionLines }: PersonalReflectionSectionProps) {
  if (reflectionLines.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Personal Reflection" />
      <Card className="mt-3 flex flex-col gap-2">
        {reflectionLines.map((line) => (
          <p key={line} className="text-sm text-[var(--color-foreground)]">
            {line}
          </p>
        ))}
      </Card>
    </section>
  );
}
