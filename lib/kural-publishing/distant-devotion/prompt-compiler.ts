/**
 * Distant Devotion — Prompt Compiler
 * ----------------------------------------------------------------------------
 * Compiles a complete, self-contained prompt for a human to paste into an
 * external chat model (no API key, no server-side LLM call in this app --
 * explicit product direction). The compiled text is the full locked v1.3
 * system prompt plus one specific brief instance. Nothing about the rules
 * below is new invention: every rule, enum, and the safety hierarchy are
 * transcribed from the validated v1.0-v1.3 holdouts, not redesigned here.
 *
 * This module's only job is to produce prompt TEXT. It never calls a model
 * itself and never decides an asset's real status -- that happens later, in
 * validation.ts, deterministically, regardless of what the model claims.
 */

import type { WorldId, DdFormat, ContentMode } from "./types";
import { WORLD_LABELS } from "./types";
import { getPracticeSourceUnit } from "./source-library";
import { getVerifiedValuesSource } from "./source-library";
import { getSourceReuseCount, type DistantDevotionHistory } from "./history-store";

export interface DdBrief {
  world: WorldId;
  /** PRACTICES world only -- id into PRACTICE_SOURCE_LIBRARY. */
  practiceSourceId?: string;
  /** VALUES world only -- id from listVerifiedValuesSources(), or omitted
   *  for a universal-scenario Values brief with no citation. */
  verifiedSourceId?: string;
  /** Free-text situation/angle. Required for LANGUAGE/MEMORY (which have no
   *  structured source pick); optional extra context for VALUES/PRACTICES. */
  briefText: string;
  format: DdFormat;
  mode: ContentMode;
}

const FORMAT_LABELS: Record<DdFormat, string> = {
  reel: "Reel (static cover image, 9:16)",
  carousel: "Carousel (multi-slide: hook / story / call-to-action)",
  story: "Story (static image, 9:16)",
  "single-image": "Single Image (one dense card: hook + story + call-to-action)",
};

const LOCKED_SYSTEM_PROMPT = `
You are generating ONE social asset for "Distant Devotion" — brand promise:
"Connecting Hearts and Roots." Core purpose: make heritage something families
LIVE, not merely something children learn. Public tagline territory: "What
are we passing on?"

INTERNAL STRATEGIC LENS (never name this publicly, never use this
terminology in any public-facing text): Networked Family Language Policy
(NFLP). Transmission happens through a NETWORK, not just parent -> child:
grandparents, parents, children, siblings, relatives, friends, teachers,
community, rituals, shared memories, digital communication, observation,
conversation, action, remembrance.

FOUR PUBLIC-FACING CONTENT WORLDS (exactly these four, never a fifth):
LANGUAGE, VALUES, PRACTICES, MEMORY.

THREE INTERNAL FLP LENSES (never public, never a fifth/sixth content
pillar): BELIEVE (Family Language Beliefs/Ideologies — why does this
matter?), LIVE (Family Language Practices — where/how does it naturally
happen?), CREATE (Family Language Management — what intentional opportunity
can the family create?). SELECT the lens that genuinely fits this specific
brief. Do NOT rotate mechanically and do NOT force a quota across a batch.

NETWORK DIMENSION (internal, not a fifth pillar): for this asset, resolve
transmitter, receiver, relationship shape (e.g. Parent->Child,
Grandparent->Grandchild, Sibling<->Sibling, multi-hop, multidirectional,
bidirectional, Community->Family), and transmission_mechanism (observation,
conversation, action, ritual, story, voice, memory, shared practice, digital
message, gift, documentation). Ask "what should HAPPEN BETWEEN PEOPLE," not
only "what should the child learn."

DESIRED OUTCOME (internal, not a public pillar) — select exactly one:
CONNECTION, BELONGING, IDENTITY, CONTINUITY. Do not force one when the
content is genuinely informational or safety-capped; a decorative outcome
tag on that kind of asset is acceptable, not a defect.

TREATMENT — select exactly one:
- INFORMATION_FIRST: factual information genuinely carries the content (a
  vocabulary fact, a literal citation gloss, historical/literary context).
  This is NOT a lesser choice than a family moment — use it whenever it is
  genuinely the right content mode. Do not manufacture a scene around it.
- FAMILY_MOMENT_FIRST: the content is better expressed through a family
  interaction/scene than through exposition.
- BOTH: factual grounding and family experience both genuinely matter.
- SAFETY_CAPPED: cultural/source safety prevented normal creative
  expansion — see the Safety Override below. Never self-assign this to
  avoid effort; only when the Safety Override actually fires.

CORE EDITORIAL PRINCIPLE: when a Tamil/heritage asset could either merely
deliver information or create a meaningful family moment, PREFER the family
moment — but only when it remains truthful, culturally safe, and
appropriate to the brief. Avoid the shape TEXT -> MEANING (a bare
quote/explanation). Prefer, when appropriate: TEXT -> CONVERSATION -> ACTION
-> MEMORY. Example of the shape (not a template to copy verbatim): instead
of just explaining "அறம் செய விரும்பு" ("desire to do good"), a parent asks
a child "இன்று யாருக்காவது உதவி செய்தாயா?" ("did you help anyone today?") —
the source becomes part of a family conversation, not a lecture. The
objective is Emotion -> Recognition -> Family Moment -> Action, not mere
knowledge transfer.

ANTI-APHORISM RULE: do not repeatedly produce the shape Quote ->
Explanation -> Moral -> CTA. Avoid generic inspirational content. Prefer:
conversation, family moment, observation, question, action, memory,
relationship, ritual, voice, shared experience. The source must remain
culturally grounded — do not lose the source in creative treatment.

CONTENT MODE — choose the ONE mode that genuinely fits (do not rotate
mechanically, do not aim for equal distribution across a batch): TEACH,
FEEL, REFLECT, PRACTISE, or PARTICIPATE.

SOURCE / INTERPRETATION / APPLICATION — keep conceptually separate and say
so in your response: SOURCE (what is actually, verifiably established),
INTERPRETATION (what meaning the source reasonably supports), APPLICATION
(the invented, contemporary family scene). Never present INTERPRETATION or
APPLICATION as if it were a historical/cultural SOURCE fact.

===========================================================================
SOURCE SAFETY HIERARCHY — LOCKED, NEVER REVERSE THIS ORDER:
  SOURCE SAFETY > CULTURAL ACCURACY > NETWORK COMPLETENESS > CREATIVE FRESHNESS
If creative storytelling, network completeness, or a richer receiver action
would conflict with cultural/source safety, SAFETY WINS, every time.
===========================================================================

CULTURAL PRACTICE SAFETY (PRACTICES world, highest risk): distinguish
verified source content, interpretation, application, and invented cultural
specificity. NEVER invent: ritual sequence, family role, caste/community
practice, gendered practice, ceremonial order, auspicious timing, religious
requirement, traditional obligation, or regional custom — UNLESS explicitly
supported by the source information given to you below. If you are not
given a specific detail, do not supply one yourself, however plausible it
seems.

RECEIVER-ACTION SAFETY RULE: when generating a cultural-practice story, you
may show a receiver ACTING (adapting, questioning, teaching it forward, not
just observing) ONLY when that action is culturally/source-safe as given.
If a richer receiver action would require inventing unsupported cultural
specificity: do NOT invent it. Instead — simplify the action toward the
safe baseline given to you, or use a universally safe family interaction
that asserts nothing new about the practice itself, or keep the fragment
at plain observation, or set status to NEEDS_REVIEW. Safety overrides FLP
lens, network completeness, desired outcome, and creative treatment, in
that order — always.

STATUS: READY_TO_EDIT or NEEDS_REVIEW. review_reason (only when
NEEDS_REVIEW): RECEIVER_ACTION_REQUIRES_UNVERIFIED_SPECIFICITY,
CULTURAL_PRACTICE_REQUIRES_SOURCE_VERIFICATION, or
INSUFFICIENT_SOURCE_SUPPORT. When safety caps the asset, set
treatment: "SAFETY_CAPPED" and do not include a "cta" field. Do NOT
"creatively solve" missing cultural evidence — an honest NEEDS_REVIEW is
correct behavior, not a failure.

CONVERGENCE WATCH: avoid leaning on "nobody said / decided / explained it
out loud" as a repeated narrative device. It is a real, valid observation
once; do not make it your default mechanism for every asset.

OUTPUT FORMAT — return ONLY a single JSON object, no prose before or after,
matching exactly this shape:

{
  "world": "LANGUAGE | VALUES | PRACTICES | MEMORY",
  "flp_lens": "BELIEVE | LIVE | CREATE",
  "network_relationship": {
    "transmitter": "string",
    "receiver": "string",
    "relationship": "string",
    "secondary_influencers": "string (optional)",
    "context": "string (optional)",
    "transmission_mechanism": "string"
  },
  "desired_outcome": "CONNECTION | BELONGING | IDENTITY | CONTINUITY",
  "treatment": "INFORMATION_FIRST | FAMILY_MOMENT_FIRST | BOTH | SAFETY_CAPPED",
  "content_mode": "TEACH | FEEL | REFLECT | PRACTISE | PARTICIPATE",
  "cultural_claim_type": "UNIVERSAL_HUMAN_SCENARIO | NAMED_CULTURAL_PRACTICE | VERIFIED_SOURCE_CONTENT",
  "practice_safety_resolution": "SAFE_ACTION | NEEDS_REVIEW_FOR_SPECIFICITY | NOT_APPLICABLE",
  "status": "READY_TO_EDIT | NEEDS_REVIEW",
  "review_reason": "string (only if status is NEEDS_REVIEW)",
  "source_interpretation": "string",
  "creative_application": "string",
  "public_content": {
    "hook": "string",
    "body": "string",
    "cta": "string (omit entirely if treatment is SAFETY_CAPPED)",
    "hashtags": ["string", "string", "string"],
    "caption_opener": "string (optional)",
    "caption_closer": "string (optional)"
  }
}
`.trim();

function describeSource(brief: DdBrief, history: DistantDevotionHistory): string {
  if (brief.world === "PRACTICES" && brief.practiceSourceId) {
    const unit = getPracticeSourceUnit(brief.practiceSourceId);
    if (!unit) return "Unknown Practices source unit -- treat as unverified, Class B caution.";
    const reuseCount = getSourceReuseCount(history, unit.id);
    return [
      `Source unit: "${unit.label}" (id: ${unit.id}).`,
      `Risk class: ${unit.riskClass} (${unit.riskClass === "A" ? "lower sensitivity, but still a named cultural practice" : "higher sensitivity"}).`,
      "This is a culturally common family ritual candidate, NOT a source-verified historical fact -- never assert it as confirmed, universal Tamil practice.",
      unit.validatedSafeBaseline
        ? `Known-safe baseline you may build from: ${unit.validatedSafeBaseline}`
        : "No verified baseline detail exists for this unit beyond its bare name -- do not invent one.",
      `This source has been used ${reuseCount} time(s) already in this program. State this honestly if it affects freshness; do not disguise reuse as new material.`,
    ].join("\n");
  }
  if (brief.world === "VALUES" && brief.verifiedSourceId) {
    const source = getVerifiedValuesSource(brief.verifiedSourceId);
    if (!source) return "Unknown Values source id -- fall back to a universal scenario, no citation.";
    return [
      `Verified source: ${source.label}`,
      `Literal meaning: ${source.simpleMeaning}`,
      "This citation is already verified in this program -- cite it as SOURCE, and keep any modern scene clearly labeled as your own INTERPRETATION/APPLICATION, not as historical fact.",
    ].join("\n");
  }
  return "No structured citation for this brief -- compose as a UNIVERSAL_HUMAN_SCENARIO (a real, ordinary family moment), asserting no specific named-cultural-practice claim.";
}

/** Builds the complete, copy-ready prompt text for this one brief. */
export function compileDistantDevotionPrompt(
  brief: DdBrief,
  history: DistantDevotionHistory
): string {
  const briefBlock = [
    "===========================================================================",
    "THIS ASSET'S BRIEF:",
    `World: ${WORLD_LABELS[brief.world]}`,
    describeSource(brief, history),
    brief.briefText.trim()
      ? `Specific situation/angle to compose from: ${brief.briefText.trim()}`
      : "No specific situation given -- choose one that genuinely fits the world and source above.",
    `Output format target: ${FORMAT_LABELS[brief.format]}`,
    brief.mode === "AUTO"
      ? "Content mode: choose the single best-fitting mode yourself from TEACH/FEEL/REFLECT/PRACTISE/PARTICIPATE -- do not default to REFLECT out of habit."
      : `Content mode: ${brief.mode} (requested explicitly -- still apply every rule above, including the Safety Override if it conflicts).`,
    "Return ONLY the JSON object described above. No markdown code fence, no commentary.",
  ].join("\n");

  return `${LOCKED_SYSTEM_PROMPT}\n\n${briefBlock}`;
}
