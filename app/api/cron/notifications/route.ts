import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

// The 4 canonical stage thresholds this contributor's continuity_month_count
// crosses -- lib/journey.ts's own STAGE_REQUIREMENTS (thulir/kandru/maram/
// vanam), not an invented separate cadence for Continuity Reminders.
const STAGE_THRESHOLDS = [2, 6, 12, 24];

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Phase 4's two time-based notification types (Participation Reminders,
 * Continuity Reminders -- Act Published is event-driven, fired directly
 * from lib/publishing-actions.ts's publishAction instead). Driven by a
 * Vercel Cron Job (see vercel.json) hitting this route daily; Vercel signs
 * the request with `Authorization: Bearer $CRON_SECRET`, which must be set
 * as an env var in the Vercel project for this to ever accept a request.
 *
 * Uses the service-role client (see lib/supabase/service.ts's own header
 * comment) -- same as Mission Camera's unauthenticated writes -- since a
 * scheduled job has no signed-in user session to run RLS against.
 *
 * Each reminder type is deduped to at most once per contributor per
 * calendar month: re-running this job (retries, multiple daily invocations)
 * must never re-notify someone who was already reminded this month.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured on this deployment." }, { status: 500 });

  const month = currentMonthKey();
  const monthStart = `${month}-01T00:00:00.000Z`;

  const { data: contributors } = await supabase
    .from("contributors")
    .select("id, notify_participation_reminders, notify_continuity_reminders");
  const allContributors = contributors ?? [];

  // -- Participation Reminders: "It's time for this month's Act of Aram" --
  const { data: thisMonthParticipations } = await supabase
    .from("participations")
    .select("contributor_id")
    .eq("month", month)
    .eq("status", "completed");
  const participatedIds = new Set((thisMonthParticipations ?? []).map((p) => p.contributor_id as string));

  const { data: existingParticipationReminders } = await supabase
    .from("notifications")
    .select("contributor_id")
    .eq("type", "participation_reminder")
    .gte("created_at", monthStart);
  const alreadyRemindedParticipationIds = new Set((existingParticipationReminders ?? []).map((n) => n.contributor_id as string));

  const participationReminderRows = allContributors
    .filter(
      (c) =>
        c.notify_participation_reminders &&
        !participatedIds.has(c.id as string) &&
        !alreadyRemindedParticipationIds.has(c.id as string)
    )
    .map((c) => ({
      contributor_id: c.id as string,
      type: "participation_reminder",
      title: "It's time for this month's Act of Aram",
      body: "Continue your journey by participating this month.",
      link: "/participate/causes",
    }));
  if (participationReminderRows.length > 0) {
    await supabase.from("notifications").insert(participationReminderRows);
  }

  // -- Continuity Reminders: "You have maintained N months of continuity" --
  const { data: journeys } = await supabase
    .from("aram_journeys")
    .select("contributor_id, continuity_month_count")
    .in("continuity_month_count", STAGE_THRESHOLDS);

  const { data: existingContinuityReminders } = await supabase
    .from("notifications")
    .select("contributor_id")
    .eq("type", "continuity_reminder")
    .gte("created_at", monthStart);
  const alreadyRemindedContinuityIds = new Set((existingContinuityReminders ?? []).map((n) => n.contributor_id as string));

  const contributorById = new Map(allContributors.map((c) => [c.id as string, c]));

  const continuityReminderRows = (journeys ?? [])
    .filter((j) => {
      const contributor = contributorById.get(j.contributor_id as string);
      return contributor?.notify_continuity_reminders && !alreadyRemindedContinuityIds.has(j.contributor_id as string);
    })
    .map((j) => ({
      contributor_id: j.contributor_id as string,
      type: "continuity_reminder",
      title: `You have maintained ${j.continuity_month_count} months of continuity`,
      body: "Your practice of Aram continues to grow.",
      link: "/practice",
    }));
  if (continuityReminderRows.length > 0) {
    await supabase.from("notifications").insert(continuityReminderRows);
  }

  return NextResponse.json({
    participationRemindersSent: participationReminderRows.length,
    continuityRemindersSent: continuityReminderRows.length,
  });
}
