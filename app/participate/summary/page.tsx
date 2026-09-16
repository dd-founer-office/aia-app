import { redirect } from "next/navigation";
import { getCurrentContributor } from "@/lib/contributor";
import { STAGE_LABELS } from "@/types";
import { ParticipationSummaryClient } from "@/components/participate/ParticipationSummaryClient";

// CA-014 Locked v1.0, Step 2 -- Participation Summary. Server Component
// since the contributor's stage/continuity need the cookie-authenticated
// server client; the actual selected causes live in
// ParticipationFlowContext (client-side sessionStorage), read by
// ParticipationSummaryClient.
export default async function ParticipationSummaryPage() {
  const contributor = await getCurrentContributor();
  if (!contributor) redirect("/sign-in");
  // Already participated this month -- Step 4 reads real DB state for the
  // current month regardless of how it's reached, so this is a safe,
  // correct redirect rather than a special-cased message here.
  if (contributor.hasParticipatedThisMonth) redirect("/participate/recorded");

  const stageLabel = STAGE_LABELS[contributor.currentStage];
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <ParticipationSummaryClient
      stageLabel={`${stageLabel.emoji} ${stageLabel.en}`}
      continuityMonthCount={contributor.continuityMonthCount}
      monthLabel={monthLabel}
    />
  );
}
