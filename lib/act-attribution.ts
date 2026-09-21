import { getSupabasePublicClient } from "@/lib/supabase/client";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/**
 * Real "Shared Act of Aram" / "Participating Contributors" data (CA-009
 * Section 4, CA-010 Section 4, CA-011's own field), closing the gap the
 * codebase had documented since Sprint 1: no entity existed linking a
 * specific contributor's participation to a specific published Act, so
 * these locked sections could only ever render as hidden/empty.
 *
 * Two read paths, because the tables in between (executions, allocations)
 * are operator-only and participation_allocations only lets a contributor
 * read their own rows (see that migration's own RLS) -- neither an
 * anonymous Acts Feed visitor nor the contributor's own session can walk
 * this join directly:
 *  - getActContributorCounts(): public, count-only, via the
 *    get_act_contributor_counts() SECURITY DEFINER function -- safe to
 *    call from the anonymous client since it only ever returns a number,
 *    never which contributors.
 *  - getMyLinkedPublishedMissionIds(): the signed-in contributor's own
 *    linked missions, via get_my_linked_published_mission_ids(), which
 *    resolves entirely from auth.uid() inside the function -- it cannot
 *    be asked about anyone else.
 */
export async function getActContributorCounts(missionIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (missionIds.length === 0) return result;

  const supabase = getSupabasePublicClient();
  if (!supabase) return result;

  const { data } = await supabase.rpc("get_act_contributor_counts", { mission_ids: missionIds });
  for (const row of data ?? []) {
    result.set(row.mission_id as string, Number(row.contributor_count));
  }
  return result;
}

export async function getMyLinkedPublishedMissionIds(): Promise<string[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.rpc("get_my_linked_published_mission_ids");
  return (data ?? []).map((row: { mission_id: string }) => row.mission_id);
}
