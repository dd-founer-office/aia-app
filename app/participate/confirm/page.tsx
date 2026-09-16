import { redirect } from "next/navigation";
import { getCurrentContributor } from "@/lib/contributor";
import { STAGE_LABELS } from "@/types";
import { ParticipationConfirmClient } from "@/components/participate/ParticipationConfirmClient";

// CA-014 Locked v1.0, Step 3 -- Confirmation.
export default async function ParticipationConfirmPage() {
  const contributor = await getCurrentContributor();
  if (!contributor) redirect("/sign-in");
  if (contributor.hasParticipatedThisMonth) redirect("/participate/recorded");

  const stageLabel = STAGE_LABELS[contributor.currentStage];
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <ParticipationConfirmClient
      stageLabel={`${stageLabel.emoji} ${stageLabel.en}`}
      continuityMonthCount={contributor.continuityMonthCount}
      monthLabel={monthLabel}
    />
  );
}
