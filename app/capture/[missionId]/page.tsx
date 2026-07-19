import { notFound } from "next/navigation";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getMissionTemplateByCategory } from "@/lib/mission-templates";
import { MissionCamera } from "@/components/capture/MissionCamera";

const CAUSE_TO_CATEGORY: Record<string, string> = {
  Education: "student",
  Medical: "family",
  Annadhanam: "annadhanam",
  Environment: "tree",
};

export default async function MissionCameraPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const supabase = getSupabaseServiceClient();
  if (!supabase) notFound();

  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (!mission) notFound();

  const category = CAUSE_TO_CATEGORY[mission.cause as string] ?? "student";
  const template = getMissionTemplateByCategory(category);
  if (!template) notFound();

  return <MissionCamera missionId={missionId} missionName={mission.mission_name as string} template={template} />;
}
