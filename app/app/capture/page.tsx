import Link from "next/link";
import { MISSION_TEMPLATES } from "@/lib/mission-templates";

// Temporary test harness — not a locked screen. Real entry point (from
// an Opportunity/Execution flow) is a follow-up decision.
//
// NOTE: bg-[var(--color-background)] intentionally removed from this root
// wrapper -- body already carries this exact background color
// (globals.css), so this class was a redundant duplicate paint that
// silently hid the Living Field's ambient canvas. Same fix as app/page.tsx
// (Sprint 01 Foundation Completion). No other change.
export default function MissionPickerPage() {
  return (
    <div className="min-h-dvh px-5 py-8">
      <p className="mb-1 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Mission Camera — Test Harness
      </p>
      <h1 className="mb-6 font-display text-xl text-[var(--color-foreground)]">Choose a Mission</h1>
      <div className="flex flex-col gap-3">
        {MISSION_TEMPLATES.map((m) => (
          <Link
            key={m.id}
            href={`/capture/${m.id}`}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4"
          >
            <p className="font-medium text-[var(--color-foreground)]">{m.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{m.requirements.length} evidence items</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
