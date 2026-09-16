import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, HeartPulse, Soup, TreePine, CheckCircle2 } from "lucide-react";
import { getCurrentContributor, currentMonthKey } from "@/lib/contributor";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/shared/Button";
import { CAUSES, type CauseId } from "@/types/participation";
import { ResetParticipationFlowOnMount } from "@/components/participate/ResetParticipationFlowOnMount";

const ICONS = { BookOpen, HeartPulse, Soup, TreePine } as const;

// CA-014 Locked v1.0, Step 4 -- Participation Recorded. Reads the real,
// just-written participations/participation_causes rows for the current
// month (not client-side flow state, which may already be reset) -- this
// page renders correctly no matter how it's reached: right after
// confirming, or a later revisit within the same month.
export default async function ParticipationRecordedPage() {
  const contributor = await getCurrentContributor();
  if (!contributor) redirect("/sign-in");

  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect("/sign-in");

  const { data: participation } = await supabase
    .from("participations")
    .select("id")
    .eq("contributor_id", contributor.contributorId)
    .eq("month", currentMonthKey())
    .maybeSingle();

  // Nothing recorded yet for this month -- reaching this page directly
  // without having gone through the flow. Start over rather than showing
  // an empty success screen.
  if (!participation) redirect("/participate/causes");

  const { data: participationCauses } = await supabase
    .from("participation_causes")
    .select("causes(slug)")
    .eq("participation_id", participation.id);

  const selectedSlugs = new Set(
    (participationCauses ?? [])
      // Runtime shape is a single embedded object (participation_causes.cause_id
      // is a many-to-one FK to causes), but without generated DB types
      // supabase-js can't distinguish that from a to-many relation -- hence
      // the through-unknown cast rather than a direct one.
      .map((row) => (row.causes as unknown as { slug: CauseId } | null)?.slug)
      .filter((slug): slug is CauseId => Boolean(slug))
  );
  const recordedCauses = CAUSES.filter((cause) => selectedSlugs.has(cause.id));

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex min-h-screen flex-col">
      <ResetParticipationFlowOnMount />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        <CheckCircle2 size={56} className="text-[var(--color-primary)]" strokeWidth={1.5} />

        <div className="flex flex-col gap-1">
          <p className="text-xl font-semibold leading-snug text-[var(--color-foreground)]">
            Participation recorded — {monthLabel}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {recordedCauses.map((cause) => {
              const Icon = ICONS[cause.icon];
              return (
                <span
                  key={cause.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-foreground)]"
                >
                  <Icon size={14} className="text-[var(--color-primary)]" strokeWidth={1.75} />
                  {cause.title}
                </span>
              );
            })}
          </div>
        </div>

        <p className="max-w-xs text-sm text-[var(--color-muted-foreground)]">
          AiA will now identify, verify and execute opportunities within your selected causes this
          month.
        </p>

        <div className="flex w-full flex-col gap-3">
          <Link href="/">
            <Button className="w-full">Return Home</Button>
          </Link>
          <Link href="/practice">
            <Button variant="secondary" className="w-full">
              View Journey
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
