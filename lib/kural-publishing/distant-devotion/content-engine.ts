/**
 * Distant Devotion — Content Engine
 * ----------------------------------------------------------------------------
 * The one place a brief + a pasted, parsed, validated model response become a
 * DdComposedAsset ready for rendering -- the Distant Devotion analogue of
 * aathichoodi/content-engine.ts's composeEpisode(), except the creative
 * generation step happens outside this app (see the distant-devotion/
 * directory's own doc comments) rather than from a local data pool.
 */

import type { WorldId, DdComposedAsset, DdMetadata } from "./types";
import type { DdBrief } from "./prompt-compiler";
import type { ParsedDdResponse } from "./response-parser";
import { validateDistantDevotionResponse } from "./validation";
import { getPracticeSourceUnit, getVerifiedValuesSource, listVerifiedValuesSources } from "./source-library";
import {
  type DistantDevotionHistory,
  getSourceReuseCount,
  recordDdGeneration,
} from "./history-store";

function describeSourceLabel(world: WorldId, brief: DdBrief): string {
  if (world === "PRACTICES" && brief.practiceSourceId) {
    return getPracticeSourceUnit(brief.practiceSourceId)?.label ?? "Unknown Practices source";
  }
  if (world === "VALUES" && brief.verifiedSourceId) {
    return getVerifiedValuesSource(brief.verifiedSourceId)?.label ?? "Unknown Values source";
  }
  return "No citation — universal scenario";
}

export interface ComposeDdResult {
  asset: DdComposedAsset;
  nextHistory: DistantDevotionHistory;
  /** Every downgrade validation.ts applied, for display alongside the
   *  Editorial Intelligence panel -- never hidden from the editor. */
  validationNotes: string[];
}

/** Combines a brief, the parsed model response, and the current reuse
 *  history into a validated, render-ready asset. Never trusts
 *  response.status/treatment directly -- always routes through
 *  validateDistantDevotionResponse first. */
export function composeDistantDevotionAsset(
  brief: DdBrief,
  response: ParsedDdResponse,
  history: DistantDevotionHistory
): ComposeDdResult {
  const validation = validateDistantDevotionResponse(response, brief);

  const sourceUnitId =
    brief.world === "PRACTICES" ? brief.practiceSourceId : brief.world === "VALUES" ? brief.verifiedSourceId : undefined;
  const reuseCount = sourceUnitId ? getSourceReuseCount(history, sourceUnitId) + 1 : 0;
  const practiceUnit = brief.world === "PRACTICES" && brief.practiceSourceId ? getPracticeSourceUnit(brief.practiceSourceId) : undefined;

  const metadata: DdMetadata = {
    contentSystem: "DISTANT_DEVOTION",
    world: response.world,
    source: describeSourceLabel(brief.world, brief),
    sourceUnitId,
    flpLens: response.flpLens,
    network: response.network,
    desiredOutcome: response.desiredOutcome,
    treatment: validation.treatment,
    contentMode: response.contentMode,
    culturalClaimType: response.culturalClaimType,
    practiceSafetyResolution: response.practiceSafetyResolution,
    status: validation.status,
    reviewReason: validation.reviewReason,
    sourceReuseCount: reuseCount,
    sourcePoolStatus: practiceUnit
      ? `${practiceUnit.riskClass === "B" ? "Higher-sensitivity" : "Lower-sensitivity"} Family Ritual unit, culturally common and not source-verified.`
      : brief.world === "VALUES" && brief.verifiedSourceId
        ? "Verified citation."
        : "No citation required for this brief.",
  };

  const nextHistory = recordDdGeneration(history, {
    world: response.world,
    flpLens: response.flpLens,
    contentMode: response.contentMode,
    sourceUnitId,
  });

  return {
    asset: { metadata, content: validation.publicContent },
    nextHistory,
    validationNotes: validation.notes,
  };
}

export { listVerifiedValuesSources };
