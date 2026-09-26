/**
 * Distant Devotion — Deterministic Validation
 * ----------------------------------------------------------------------------
 * The actual safety enforcement point. Because generation happens outside
 * this app (an external chat model, pasted back in -- see prompt-compiler.ts
 * / response-parser.ts), this app cannot rely on the pasted response's own
 * status/practice_safety_resolution/treatment fields at face value: nothing
 * stops a paste from claiming READY_TO_EDIT on an asset that shouldn't be.
 * This module re-derives the fields that matter from the SOURCE LIBRARY and
 * the locked hierarchy (SOURCE SAFETY > CULTURAL ACCURACY > NETWORK
 * COMPLETENESS > CREATIVE FRESHNESS), independent of the model's own claims.
 *
 * Rule: this validator may only make an asset MORE restricted than what was
 * pasted (status READY_TO_EDIT -> NEEDS_REVIEW, treatment -> SAFETY_CAPPED,
 * stripping a cta), never less. It never invents new public content.
 */

import type { DdPublicContent, DdStatus, Treatment, ReviewReason } from "./types";
import { getPracticeSourceUnit, getVerifiedValuesSource } from "./source-library";
import type { ParsedDdResponse } from "./response-parser";
import type { DdBrief } from "./prompt-compiler";

export interface DdValidationResult {
  status: DdStatus;
  treatment: Treatment;
  reviewReason?: ReviewReason;
  publicContent: DdPublicContent;
  /** Every place this validator changed something the pasted response
   *  claimed, in plain language -- shown in the Editorial Intelligence
   *  panel so a downgrade is never silent. */
  notes: string[];
}

export function validateDistantDevotionResponse(
  response: ParsedDdResponse,
  brief: DdBrief
): DdValidationResult {
  const notes: string[] = [];
  let status: DdStatus = response.status;
  let treatment: Treatment = response.treatment;
  let reviewReason: ReviewReason | undefined = response.reviewReason;
  let publicContent: DdPublicContent = { ...response.publicContent };

  function forceSpecificityCap(reason: string): void {
    if (status !== "NEEDS_REVIEW" || treatment !== "SAFETY_CAPPED") {
      notes.push(reason);
    }
    status = "NEEDS_REVIEW";
    treatment = "SAFETY_CAPPED";
    reviewReason = "RECEIVER_ACTION_REQUIRES_UNVERIFIED_SPECIFICITY";
    if (publicContent.cta !== undefined) {
      notes.push('Removed "cta" -- a safety-capped asset does not get a public call to action, regardless of what was pasted.');
      publicContent = { ...publicContent, cta: undefined };
    }
  }

  function forceStandingReview(reason: string): void {
    if (status !== "NEEDS_REVIEW") {
      notes.push(reason);
    }
    status = "NEEDS_REVIEW";
    if (!reviewReason) reviewReason = "CULTURAL_PRACTICE_REQUIRES_SOURCE_VERIFICATION";
  }

  // 1. The model's own specificity self-report is always honored upward
  //    (never downgraded away) -- if it says the receiver action required
  //    unverified specificity, that stands regardless of risk class.
  if (response.practiceSafetyResolution === "NEEDS_REVIEW_FOR_SPECIFICITY") {
    forceSpecificityCap(
      "The pasted response itself reported NEEDS_REVIEW_FOR_SPECIFICITY -- honored as-is (this validator never relaxes a self-reported safety concern)."
    );
  }

  // 2. PRACTICES world with a known source unit: re-derive from riskClass,
  //    independent of what the model claimed.
  if (brief.world === "PRACTICES") {
    const unit = brief.practiceSourceId ? getPracticeSourceUnit(brief.practiceSourceId) : undefined;
    if (unit) {
      if (unit.riskClass === "B" && status !== "NEEDS_REVIEW") {
        forceStandingReview(
          `"${unit.label}" is a Class B Practices source (higher sensitivity) -- forced to NEEDS_REVIEW for standing source verification regardless of the pasted status, per the locked Cultural-Practice Status Rule.`
        );
      }
    } else {
      // No known unit picked -- cannot confirm class at all. Conservative
      // default: any NAMED_CULTURAL_PRACTICE claim in PRACTICES without a
      // verifiable unit is held for review.
      if (response.culturalClaimType === "NAMED_CULTURAL_PRACTICE" && status !== "NEEDS_REVIEW") {
        reviewReason = reviewReason ?? "INSUFFICIENT_SOURCE_SUPPORT";
        forceStandingReview(
          "This Practices asset claims a named cultural practice but no known source-library unit was selected for this brief -- cannot verify its risk class, so it is conservatively held for review."
        );
      }
    }
  }

  // 3. NAMED_CULTURAL_PRACTICE is world-agnostic (v1.3's Golu/Memory
  //    finding): a Memory or Language asset asserting a named practice
  //    still needs standing verification, not just Practices-world ones.
  if (response.culturalClaimType === "NAMED_CULTURAL_PRACTICE" && brief.world !== "PRACTICES" && status !== "NEEDS_REVIEW") {
    forceStandingReview(
      "This asset asserts a named cultural practice outside the Practices world -- the Cultural-Practice Status Rule applies regardless of world, so it is held for standing verification."
    );
  }

  // 4. A VERIFIED_SOURCE_CONTENT claim must actually correspond to a real
  //    citation this brief supplied -- otherwise the model may be
  //    asserting verification it has no basis for.
  if (response.culturalClaimType === "VERIFIED_SOURCE_CONTENT") {
    const hasRealCitation = brief.world === "VALUES" && !!brief.verifiedSourceId && !!getVerifiedValuesSource(brief.verifiedSourceId);
    if (!hasRealCitation && status !== "NEEDS_REVIEW") {
      reviewReason = reviewReason ?? "INSUFFICIENT_SOURCE_SUPPORT";
      forceStandingReview(
        "This response claims VERIFIED_SOURCE_CONTENT but this brief did not supply a matching citation from the source library -- held for review rather than trusted at face value."
      );
    }
  }

  // 5. SAFETY_CAPPED must never carry a cta, no matter how it was reached.
  if (treatment === "SAFETY_CAPPED" && publicContent.cta !== undefined) {
    notes.push('Removed "cta" on a SAFETY_CAPPED asset.');
    publicContent = { ...publicContent, cta: undefined };
  }

  return { status, treatment, reviewReason, publicContent, notes };
}
