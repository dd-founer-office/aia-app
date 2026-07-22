import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import type { PublishedActSummary } from "@/lib/published-acts";

// Minimal, honest Act Detail render for real (Supabase-backed) published
// missions. Deliberately does NOT attempt to show story/timeline/
// verification/documents sections that MockAct has -- Mission Review does
// not collect that data, and inventing it would violate the "no
// placeholder business content" rule. Expand this only once Ops actually
// collects those fields.
//
// NOTE: bg-[var(--color-background)] intentionally removed from this root
// wrapper -- body already carries this exact background color
// (globals.css), so this class was a redundant duplicate paint that
// silently hid the Living Field's ambient canvas. Same fix as app/page.tsx
// (Sprint 01 Foundation Completion). No other change.
export function PublishedActDetail({ act }: { act: PublishedActSummary; id: string }) {
  return (
    <div className="flex min-h-screen flex-col gap-5 px-5 pb-16 pt-6">
      {act.heroImageUrl && (
        <div
          className="w-full overflow-hidden"
          style={{ borderRadius: "var(--radius-card)", aspectRatio: "4 / 3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={act.heroImageUrl} alt={act.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {act.cause}
        </span>
        <h1 className="font-display text-xl text-[var(--color-foreground)]">{act.title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{act.description}</p>
      </div>

      <Card>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-muted-foreground)]">Organization</dt>
            <dd className="text-[var(--color-foreground)]">{act.organization}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-muted-foreground)]">Date</dt>
            <dd className="text-[var(--color-foreground)]">{act.missionDate}</dd>
          </div>
          {act.landmark && (
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Location</dt>
              <dd className="text-[var(--color-foreground)]">{act.landmark}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Link href={`/acts/${act.id}/evidence`}>
        <Button variant="primary" className="w-full">
          View Living Trace
        </Button>
      </Link>
    </div>
  );
}
