import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { OpportunityStatus } from "@/lib/ops-dashboard";
import type { OpportunityPriority, OpportunitySource, ReadinessStatus } from "@/lib/opportunities";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ImpactAssuranceChecklist {
  opportunityVerified: boolean;
  partnerVerified: boolean;
  documentationComplete: boolean;
  siteValidationComplete: boolean;
  executionFeasibilityConfirmed: boolean;
  riskAssessmentComplete: boolean;
}

export interface PartnerValidation {
  id: string;
  name: string;
  partnerType: string | null;
  status: "pending" | "verified" | "rejected" | "suspended";
  verifiedAtIso: string | null;
  // Best-effort: missions.organization is free text, not FK'd to
  // partners.id (that link doesn't exist in the Mission Review schema).
  // Matched by exact name -- real data, but undercounts if a mission's
  // organization text doesn't match this partner's name exactly.
  pastExecutionsCount: number;
}

export interface TimelineEvent {
  label: string;
  dateIso: string;
}

export interface OpportunityDetail {
  id: string;
  title: string;
  needSummary: string | null;
  cause: string;
  district: string | null;
  beneficiaryEstimate: number | null;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  source: OpportunitySource;
  createdAtIso: string;
  targetExecutionDate: string | null;
  executionOwner: string | null;
  documentationNotes: string | null;
  informationRequestNotes: string | null;
  rejectionReason: string | null;
  checklist: ImpactAssuranceChecklist;
  riskLevel: RiskLevel;
  riskNotes: string | null;
  mitigationPlan: string | null;
  riskOwner: string | null;
  partner: PartnerValidation | null;
  timeline: TimelineEvent[];
  readiness: ReadinessStatus;
  // Header action gates -- computed here (single source of truth) and
  // re-verified independently by each Server Action rather than trusted
  // from the client.
  canApprove: boolean;
  canAllocate: boolean;
}

function allChecklistComplete(c: ImpactAssuranceChecklist): boolean {
  return (
    c.opportunityVerified &&
    c.partnerVerified &&
    c.documentationComplete &&
    c.siteValidationComplete &&
    c.executionFeasibilityConfirmed &&
    c.riskAssessmentComplete
  );
}

export function computeReadiness(
  status: OpportunityStatus,
  checklist: ImpactAssuranceChecklist,
  riskLevel: RiskLevel
): ReadinessStatus {
  if (status === "rejected" || status === "closed" || riskLevel === "critical") return "blocked";
  if (["approved", "allocated", "executing", "published"].includes(status)) return "ready";
  if (allChecklistComplete(checklist)) return "ready";
  return "needs_review";
}

export function canApproveOpportunity(
  status: OpportunityStatus,
  checklist: ImpactAssuranceChecklist,
  riskLevel: RiskLevel
): boolean {
  return (
    (status === "submitted" || status === "assuring") && allChecklistComplete(checklist) && riskLevel !== "critical"
  );
}

/** OP-003 Opportunity Detail's full data set for one opportunity. Server-
 *  side only. Returns null if the opportunity doesn't exist (caller
 *  404s). */
export async function getOpportunityDetail(id: string): Promise<OpportunityDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: opp } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (!opp) return null;

  let partner: PartnerValidation | null = null;
  if (opp.partner_id) {
    const { data: partnerRow } = await supabase
      .from("partners")
      .select("id, name, partner_type, status, verified_at")
      .eq("id", opp.partner_id)
      .maybeSingle();
    if (partnerRow) {
      const { count } = await supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("organization", partnerRow.name as string);
      partner = {
        id: partnerRow.id as string,
        name: partnerRow.name as string,
        partnerType: partnerRow.partner_type as string | null,
        status: partnerRow.status as PartnerValidation["status"],
        verifiedAtIso: partnerRow.verified_at as string | null,
        pastExecutionsCount: count ?? 0,
      };
    }
  }

  const checklist: ImpactAssuranceChecklist = {
    opportunityVerified: opp.opportunity_verified as boolean,
    partnerVerified: opp.partner_verified as boolean,
    documentationComplete: opp.documentation_complete as boolean,
    siteValidationComplete: opp.site_validation_complete as boolean,
    executionFeasibilityConfirmed: opp.execution_feasibility_confirmed as boolean,
    riskAssessmentComplete: opp.risk_assessment_complete as boolean,
  };
  const riskLevel = opp.risk_level as RiskLevel;
  const status = opp.status as OpportunityStatus;

  const timeline: TimelineEvent[] = [{ label: "Opportunity created", dateIso: opp.created_at as string }];
  if (opp.verified_at) timeline.push({ label: "Verification completed", dateIso: opp.verified_at as string });
  if (opp.approved_at) timeline.push({ label: "Approved", dateIso: opp.approved_at as string });
  if (opp.allocated_at) timeline.push({ label: "Allocated", dateIso: opp.allocated_at as string });
  if (opp.published_at) timeline.push({ label: "Published", dateIso: opp.published_at as string });
  if (opp.rejected_at) timeline.push({ label: "Rejected", dateIso: opp.rejected_at as string });
  if (opp.closed_at) timeline.push({ label: "Closed", dateIso: opp.closed_at as string });
  timeline.sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime());

  return {
    id: opp.id as string,
    title: opp.title as string,
    needSummary: opp.need_summary as string | null,
    cause: opp.cause as string,
    district: opp.district as string | null,
    beneficiaryEstimate: opp.beneficiary_estimate as number | null,
    status,
    priority: opp.priority as OpportunityPriority,
    source: opp.source as OpportunitySource,
    createdAtIso: opp.created_at as string,
    targetExecutionDate: opp.target_execution_date as string | null,
    executionOwner: opp.execution_owner as string | null,
    documentationNotes: opp.documentation_notes as string | null,
    informationRequestNotes: opp.information_request_notes as string | null,
    rejectionReason: opp.rejection_reason as string | null,
    checklist,
    riskLevel,
    riskNotes: opp.risk_notes as string | null,
    mitigationPlan: opp.mitigation_plan as string | null,
    riskOwner: opp.risk_owner as string | null,
    partner,
    timeline,
    readiness: computeReadiness(status, checklist, riskLevel),
    canApprove: canApproveOpportunity(status, checklist, riskLevel),
    canAllocate: status === "approved",
  };
}
