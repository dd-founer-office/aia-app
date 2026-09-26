/**
 * Distant Devotion — Response Parser
 * ----------------------------------------------------------------------------
 * Parses the JSON a human pastes back from an external chat model (see
 * prompt-compiler.ts for what was asked for) into a typed shape. This layer
 * only checks that the response is well-formed and every enum value is one
 * this app recognizes -- it does NOT decide whether the content is actually
 * safe. That decision belongs entirely to validation.ts, which re-derives
 * safety fields itself rather than trusting anything checked here. A
 * response that parses cleanly can still be downgraded (never upgraded) by
 * the validator.
 */

import type {
  WorldId,
  FlpLens,
  DesiredOutcome,
  Treatment,
  ContentMode,
  CulturalClaimType,
  PracticeSafetyResolution,
  DdStatus,
  ReviewReason,
  NetworkRelationship,
  DdPublicContent,
} from "./types";

const WORLD_VALUES: readonly WorldId[] = ["LANGUAGE", "VALUES", "PRACTICES", "MEMORY"];
const FLP_LENS_VALUES: readonly FlpLens[] = ["BELIEVE", "LIVE", "CREATE"];
const OUTCOME_VALUES: readonly DesiredOutcome[] = ["CONNECTION", "BELONGING", "IDENTITY", "CONTINUITY"];
const TREATMENT_VALUES: readonly Treatment[] = [
  "INFORMATION_FIRST",
  "FAMILY_MOMENT_FIRST",
  "BOTH",
  "SAFETY_CAPPED",
];
const MODE_VALUES: readonly Exclude<ContentMode, "AUTO">[] = [
  "TEACH",
  "FEEL",
  "REFLECT",
  "PRACTISE",
  "PARTICIPATE",
];
const CLAIM_TYPE_VALUES: readonly CulturalClaimType[] = [
  "UNIVERSAL_HUMAN_SCENARIO",
  "NAMED_CULTURAL_PRACTICE",
  "VERIFIED_SOURCE_CONTENT",
];
const SAFETY_RESOLUTION_VALUES: readonly PracticeSafetyResolution[] = [
  "SAFE_ACTION",
  "NEEDS_REVIEW_FOR_SPECIFICITY",
  "NOT_APPLICABLE",
];
const STATUS_VALUES: readonly DdStatus[] = ["READY_TO_EDIT", "NEEDS_REVIEW"];
const REVIEW_REASON_VALUES: readonly ReviewReason[] = [
  "RECEIVER_ACTION_REQUIRES_UNVERIFIED_SPECIFICITY",
  "CULTURAL_PRACTICE_REQUIRES_SOURCE_VERIFICATION",
  "INSUFFICIENT_SOURCE_SUPPORT",
];

export interface ParsedDdResponse {
  world: WorldId;
  flpLens: FlpLens;
  network: NetworkRelationship;
  desiredOutcome: DesiredOutcome;
  treatment: Treatment;
  contentMode: Exclude<ContentMode, "AUTO">;
  culturalClaimType: CulturalClaimType;
  practiceSafetyResolution: PracticeSafetyResolution;
  status: DdStatus;
  reviewReason?: ReviewReason;
  sourceInterpretation?: string;
  creativeApplication?: string;
  publicContent: DdPublicContent;
}

export type ParseResult =
  | { ok: true; response: ParsedDdResponse }
  | { ok: false; errors: string[] };

/** Strips a leading/trailing ```json ... ``` fence if the model added one
 *  despite being asked not to -- a common, harmless real-world deviation,
 *  not worth rejecting the whole paste over. */
function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

export function parseDistantDevotionResponse(raw: string): ParseResult {
  const errors: string[] = [];
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(stripCodeFence(raw)) as Record<string, unknown>;
  } catch {
    return { ok: false, errors: ["Could not parse this as JSON. Paste only the model's JSON object, with no extra commentary around it."] };
  }

  if (!isOneOf(obj.world, WORLD_VALUES)) errors.push('"world" is missing or not one of LANGUAGE/VALUES/PRACTICES/MEMORY.');
  if (!isOneOf(obj.flp_lens, FLP_LENS_VALUES)) errors.push('"flp_lens" is missing or not one of BELIEVE/LIVE/CREATE.');
  if (!isOneOf(obj.desired_outcome, OUTCOME_VALUES)) errors.push('"desired_outcome" is missing or not one of CONNECTION/BELONGING/IDENTITY/CONTINUITY.');
  if (!isOneOf(obj.treatment, TREATMENT_VALUES)) errors.push('"treatment" is missing or not one of INFORMATION_FIRST/FAMILY_MOMENT_FIRST/BOTH/SAFETY_CAPPED.');
  if (!isOneOf(obj.content_mode, MODE_VALUES)) errors.push('"content_mode" is missing or not one of TEACH/FEEL/REFLECT/PRACTISE/PARTICIPATE.');
  if (!isOneOf(obj.cultural_claim_type, CLAIM_TYPE_VALUES)) errors.push('"cultural_claim_type" is missing or invalid.');
  if (!isOneOf(obj.practice_safety_resolution, SAFETY_RESOLUTION_VALUES)) errors.push('"practice_safety_resolution" is missing or invalid.');
  if (!isOneOf(obj.status, STATUS_VALUES)) errors.push('"status" is missing or not one of READY_TO_EDIT/NEEDS_REVIEW.');
  if (obj.review_reason !== undefined && !isOneOf(obj.review_reason, REVIEW_REASON_VALUES)) {
    errors.push('"review_reason" is present but not a recognized value.');
  }

  const network = obj.network_relationship as Record<string, unknown> | undefined;
  if (!network || typeof network.transmitter !== "string" || typeof network.receiver !== "string" || typeof network.relationship !== "string" || typeof network.transmission_mechanism !== "string") {
    errors.push('"network_relationship" is missing required fields (transmitter, receiver, relationship, transmission_mechanism).');
  }

  const publicContent = obj.public_content as Record<string, unknown> | undefined;
  if (!publicContent || typeof publicContent.hook !== "string" || typeof publicContent.body !== "string") {
    errors.push('"public_content.hook" and "public_content.body" are required strings.');
  }
  if (obj.treatment !== "SAFETY_CAPPED" && publicContent && typeof publicContent.cta !== "string") {
    errors.push('"public_content.cta" is required unless treatment is SAFETY_CAPPED.');
  }

  if (errors.length > 0) return { ok: false, errors };

  const net = network as Record<string, unknown>;
  const pub = publicContent as Record<string, unknown>;

  return {
    ok: true,
    response: {
      world: obj.world as WorldId,
      flpLens: obj.flp_lens as FlpLens,
      network: {
        transmitter: net.transmitter as string,
        receiver: net.receiver as string,
        relationship: net.relationship as string,
        secondaryInfluencers: typeof net.secondary_influencers === "string" ? net.secondary_influencers : undefined,
        context: typeof net.context === "string" ? net.context : undefined,
        transmissionMechanism: net.transmission_mechanism as string,
      },
      desiredOutcome: obj.desired_outcome as DesiredOutcome,
      treatment: obj.treatment as Treatment,
      contentMode: obj.content_mode as Exclude<ContentMode, "AUTO">,
      culturalClaimType: obj.cultural_claim_type as CulturalClaimType,
      practiceSafetyResolution: obj.practice_safety_resolution as PracticeSafetyResolution,
      status: obj.status as DdStatus,
      reviewReason: isOneOf(obj.review_reason, REVIEW_REASON_VALUES) ? obj.review_reason : undefined,
      sourceInterpretation: typeof obj.source_interpretation === "string" ? obj.source_interpretation : undefined,
      creativeApplication: typeof obj.creative_application === "string" ? obj.creative_application : undefined,
      publicContent: {
        hook: pub.hook as string,
        body: pub.body as string,
        cta: typeof pub.cta === "string" ? pub.cta : undefined,
        hashtags: Array.isArray(pub.hashtags) ? pub.hashtags.filter((h): h is string => typeof h === "string") : undefined,
        captionOpener: typeof pub.caption_opener === "string" ? pub.caption_opener : undefined,
        captionCloser: typeof pub.caption_closer === "string" ? pub.caption_closer : undefined,
      },
    },
  };
}
