import { notFound } from "next/navigation";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getPartnerAuthState } from "@/lib/partner";
import { getMissionTemplateByCategory } from "@/lib/mission-templates";
import { MissionCamera } from "@/components/capture/MissionCamera";

const CAUSE_TO_CATEGORY: Record<string, string> = {
  Education: "student",
  Medical: "family",
  Annadhanam: "annadhanam",
  Environment: "tree",
};

/**
 * Two entry points share this one dynamic segment (Next.js requires the
 * same param name for sibling routes at a level, so they can't be split
 * into separate folders): the real partner flow
 * (/partner/activities/[id] -> here, a real executions.id) and the old
 * /capture test harness (a mission-template id, kept as an internal
 * diagnostic route per locked instruction -- not removed).
 *
 * Execution is tried FIRST, via the cookie-aware (RLS-enforced) client --
 * a partner only ever resolves their own execution here, the same
 * ownership check the partners_read_own_executions policy already makes
 * everywhere else. Only when that comes back empty (a template id, which
 * will never match a real execution row) does this fall through to the
 * old, unchanged, service-role mission lookup.
 */
export default async function MissionCameraPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;

  const auth = await getPartnerAuthState();
  if (auth.status === "partner") {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data: execution } = await supabase
        .from("executions")
        .select("id, opportunity_id, opportunities(title, cause)")
        .eq("id", executionId)
        .maybeSingle();

      if (execution) {
        const opportunity = execution.opportunities as unknown as { title: string; cause: string } | null;
        if (!opportunity) notFound();

        const category = CAUSE_TO_CATEGORY[opportunity.cause] ?? "student";
        const template = getMissionTemplateByCategory(category);
        if (!template) notFound();

        return (
          <MissionCamera
            missionId={executionId}
            missionName={opportunity.title}
            template={template}
            executionId={executionId}
          />
        );
      }
    }
  }

  // Fallback: the old, unauthenticated mission-template test harness --
  // unchanged behavior.
  const serviceClient = getSupabaseServiceClient();
  if (!serviceClient) notFound();

  const { data: mission } = await serviceClient.from("missions").select("*").eq("id", executionId).maybeSingle();
  if (!mission) notFound();

  const category = CAUSE_TO_CATEGORY[mission.cause as string] ?? "student";
  const template = getMissionTemplateByCategory(category);
  if (!template) notFound();

  return <MissionCamera missionId={executionId} missionName={mission.mission_name as string} template={template} />;
}
