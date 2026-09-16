"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { ensureExecutionForOpportunity, getExecutionManagementData, type ExecutionStatus } from "@/lib/execution";

function revalidateExecutions() {
  revalidatePath("/ops/executions");
  revalidatePath("/ops/opportunities");
  revalidatePath("/ops");
}

const ACTIVE_STATUSES: ExecutionStatus[] = ["allocated", "scheduled", "in_progress", "delayed", "blocked"];

/** OP-005 header's "Create execution" action -- a manual backfill path for
 *  an allocated opportunity that somehow doesn't have an execution row yet
 *  (e.g. it was allocated before this table existed). The normal path is
 *  automatic: every allocation action already calls
 *  ensureExecutionForOpportunity itself. */
export async function createExecutionAction(opportunityId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: opp } = await supabase.from("opportunities").select("status").eq("id", opportunityId).maybeSingle();
  if (!opp) return { error: "Opportunity not found." };
  if (!["allocated", "executing"].includes(opp.status as string)) {
    return { error: "Only allocated opportunities can have an execution created." };
  }

  const { error } = await ensureExecutionForOpportunity(supabase, opportunityId);
  if (error) return { error };

  revalidateExecutions();
  return {};
}

/**
 * OP-005 header's "Assign owner" / "Schedule execution" actions and Row 3's
 * per-row equivalent -- combined into one save, same reasoning as OP-003's
 * combined Impact Assurance save (an operator filling in both fields at
 * once shouldn't lose one to an unrelated update). Auto-advances status
 * allocated -> scheduled the first time both an owner and a date are set,
 * matching the locked rule that every allocated opportunity must have
 * both before it's genuinely "scheduled".
 */
export async function updateExecutionAssignmentAction(
  executionId: string,
  executionOwner: string,
  scheduledDate: string
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: current } = await supabase
    .from("executions")
    .select("status, execution_owner, scheduled_date, assigned_at, scheduled_at")
    .eq("id", executionId)
    .maybeSingle();
  if (!current) return { error: "Execution not found." };

  const owner = executionOwner.trim() || null;
  const date = scheduledDate || null;
  const now = new Date().toISOString();

  const update: Record<string, unknown> = { execution_owner: owner, scheduled_date: date };
  if (owner && !current.assigned_at) update.assigned_at = now;
  if (date && !current.scheduled_at) update.scheduled_at = now;
  if (current.status === "allocated" && owner && date) update.status = "scheduled";

  const { error } = await supabase.from("executions").update(update).eq("id", executionId);
  if (error) return { error: error.message };

  revalidateExecutions();
  return {};
}

/** OP-005 Row 3's Start action. Also advances the opportunity itself to
 *  'executing' (only from 'allocated', defensively) -- the opportunities
 *  table's own coarse pipeline status now reflects real execution state
 *  instead of stopping at "allocated" forever. */
export async function startExecutionAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase
    .from("executions")
    .select("opportunity_id, status")
    .eq("id", executionId)
    .maybeSingle();
  if (!execution) return { error: "Execution not found." };
  if (!ACTIVE_STATUSES.includes(execution.status as ExecutionStatus)) {
    return { error: "This execution has already finished or been cancelled." };
  }

  const { error } = await supabase
    .from("executions")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", executionId);
  if (error) return { error: error.message };

  await supabase
    .from("opportunities")
    .update({ status: "executing" })
    .eq("id", execution.opportunity_id as string)
    .eq("status", "allocated");

  revalidateExecutions();
  return {};
}

/**
 * OP-005 Row 3's Complete action. This is a status-only transition, not
 * the real Outcome Recording OP-005A specifies (actual beneficiaries,
 * outcome summary, evidence) -- that screen doesn't exist yet. Per the
 * locked rule "execution completion does not equal publication", the
 * opportunity's own status deliberately stays 'executing', not 'published'
 * -- OP-006/OP-007 are what would earn that transition.
 */
export async function completeExecutionAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase.from("executions").select("status").eq("id", executionId).maybeSingle();
  if (!execution) return { error: "Execution not found." };
  if (!["scheduled", "in_progress", "delayed"].includes(execution.status as string)) {
    return { error: "Only a scheduled, in-progress, or delayed execution can be marked complete." };
  }

  const { error } = await supabase
    .from("executions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateExecutions();
  return {};
}

/** OP-005 Row 3's Delay action. Locked rule: delayed executions require a
 *  reason -- no silent rollover. */
export async function delayExecutionAction(executionId: string, reason: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!reason.trim()) return { error: "A reason is required to mark an execution delayed." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("executions")
    .update({ status: "delayed", delay_reason: reason.trim() })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateExecutions();
  return {};
}

/** OP-005 Row 3's Block action. Critical risks (of which a block is one)
 *  require escalation per the locked rule -- captured here as a required
 *  reason visible to every operator viewing the Risk Panel. */
export async function blockExecutionAction(executionId: string, reason: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!reason.trim()) return { error: "A reason is required to block an execution." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("executions")
    .update({ status: "blocked", block_reason: reason.trim() })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateExecutions();
  return {};
}

/** OP-005 Row 3's Cancel action. Moves the opportunity itself to 'closed'
 *  -- a cancelled execution means the opportunity isn't happening, the
 *  same terminal bucket OP-003's own Reject action already uses. */
export async function cancelExecutionAction(executionId: string, reason: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!reason.trim()) return { error: "A reason is required to cancel an execution." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase
    .from("executions")
    .select("opportunity_id")
    .eq("id", executionId)
    .maybeSingle();
  if (!execution) return { error: "Execution not found." };

  const { error } = await supabase
    .from("executions")
    .update({ status: "cancelled", cancellation_reason: reason.trim() })
    .eq("id", executionId);
  if (error) return { error: error.message };

  await supabase
    .from("opportunities")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", execution.opportunity_id as string);

  revalidateExecutions();
  return {};
}

/** OP-005 header's "Export" action, same pattern as OP-004's. */
export async function exportExecutionsAction(): Promise<{ error?: string; csv?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getExecutionManagementData();
  const header = ["Execution ID", "Opportunity", "Cause", "District", "Partner", "Owner", "Scheduled date", "Status", "Priority"];
  const rows = data.executions.map((e) => [
    e.id,
    e.opportunityTitle,
    e.cause,
    e.district ?? "",
    e.partnerName ?? "",
    e.executionOwner ?? "",
    e.scheduledDate ?? "",
    e.status,
    e.priority,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

  return { csv };
}
