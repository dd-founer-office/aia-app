/**
 * Purananuru Reel Storyboard — AI Visual Direction
 * ----------------------------------------------------------------------------
 * Phase 9C. Translates the existing structured story (Phase 7's
 * ReelVisualScene, Phase 8A's Story Arc, Phase 9A's ReelMotionDirection)
 * into a complete, copyable text brief a human can paste into an external
 * AI image-generation tool -- NOT an image-generation integration. No AI
 * API call, no image SDK, no external dependency: this file is a pure,
 * deterministic string transform, the exact same contract as
 * aathichoodi/family-image-prompt.ts's buildFamilyImagePrompt (that file's
 * own header: "This app never generates or fetches images itself... This is
 * a deterministic text transform, not a call to any model").
 *
 *   Poem -> Story Arc -> Visual Story -> Motion Direction -> HERE -> prompts
 *
 * The Phase 9B abstract motion system (purananuru-reel-motion-preview-
 * renderer.ts) is UNCHANGED and UNREAD by this file -- it remains the
 * reference/prototype layer for the underlying motion grammar. This file
 * adds a parallel, human-facing layer describing what a CINEMATIC PHOTO
 * (not an abstract shape) of the same Frame 2 / Frame 5 states would look
 * like. Nothing here is drawn by any renderer; the image itself is
 * generated externally, by a human, from the copied prompt text.
 *
 * CONTINUITY: the whole reason this file exists as one shared
 * "continuity bible" per poem, rather than two independent frame prompts,
 * is Phase 9C's own guiding constraint -- Frame 2 and Frame 5 must read as
 * "same story, same world, different moment," never two unrelated
 * AI-generated images. Both frames' prompts are built from the SAME
 * ReelAIContinuityBible object (characters, environment, visual style,
 * recurring props) -- there is no separate frame2Bible/frame5Bible to
 * drift out of sync.
 *
 * SEMANTIC ANCHORING: each ReelAICharacter's `id` and each tagged
 * recurringProps entry reuse the EXACT same identifiers
 * reel-storyboard-content.ts's ReelMotionTarget already defines
 * ("giftObject", "secondaryFigure", "isolatedFigure", "communityGroup",
 * "leftColumn", "rightColumn") -- never shown in the actual prompt text
 * (which uses `role`/`appearance`/`clothing` instead), but what lets
 * reel-ai-visual-direction-qa.ts deterministically verify this file's
 * story actually matches Phase 9A's own motionDirection.relationship
 * rather than merely sitting beside it. See ReelAICharacter's own doc
 * comment.
 *
 * EDITORIAL SCOPE: every scene below is a NEW human situation the poem's
 * classical idea maps onto (same discipline canon.ts's own
 * visualStoryDirection field already documents: "a MODERN, contemporary
 * human situation the classical idea maps onto, not generic 'ancient
 * Tamil king' imagery"). Poem 91 deliberately does NOT reuse canon.ts's
 * own airport/boarding-pass visualStoryDirection scene -- Phase 7 already
 * ruled that scene out for this same Reel Storyboard ("that belongs to a
 * different, earlier storyboard and is explicitly out of scope here"),
 * and reusing it here would contradict that precedent. Poem 189
 * deliberately does NOT render Phase 9A's literal "columns" -- the brief
 * for this phase explicitly asks for a believable human scene instead,
 * translating the same underlying quantity-contrast idea without
 * abstract shapes or a rich/poor character stereotype.
 */

import type { ComposedReelStoryboard } from "./reel-storyboard-content";

/** One of two (or, for a "community", one collective) subjects appearing
 *  in BOTH Frame 2 and Frame 5 -- the same person, unchanged, in both
 *  images. `id` is an internal semantic anchor only (see this file's own
 *  header "SEMANTIC ANCHORING") -- it is never itself written into the
 *  generated prompt text, which speaks in `role`/`appearance`/`clothing`
 *  instead, exactly the way a real production continuity sheet would. */
export interface ReelAICharacter {
  id: string;
  role: string;
  ageRange?: string;
  appearance: string;
  clothing: string;
  relationship?: string;
}

export interface ReelAIEnvironment {
  location: string;
  period: string;
  timeOfDay: string;
  atmosphere: string;
  culturalContext: string;
}

/** "editorial-photography" is this dataset's one house style (Phase 9C
 *  section 13's own "premium editorial photography" default) -- kept as a
 *  per-poem field, not a hardcoded constant, only because a future poem's
 *  story might genuinely call for a different medium; all three current
 *  poems use the same value on purpose, the same "one house style"
 *  discipline family-image-prompt.ts's own header documents for
 *  Aathichoodi's family photos. */
export type ReelAIVisualMedium = "cinematic-photography" | "editorial-photography" | "cinematic-illustration";

export interface ReelAIVisualStyle {
  medium: ReelAIVisualMedium;
  cameraLanguage: string;
  lighting: string;
  colorPalette: string;
  realism: string;
}

/** The one shared "world" both Frame 2 and Frame 5 draw from -- see this
 *  file's own header "CONTINUITY". `recurringProps` entries that need a
 *  semantic anchor (see "SEMANTIC ANCHORING") are written as
 *  `"<ReelMotionTarget id>: <human-readable description>"`
 *  (e.g. `"giftObject: a small wrapped fruit, carried in cupped hands"`)
 *  -- reel-ai-visual-direction-qa.ts strips the id prefix before it would
 *  ever reach a prompt; buildReelAIFramePrompt strips it too, so only the
 *  human-readable description is ever shown to the person pasting the
 *  prompt into an image tool. */
export interface ReelAIContinuityBible {
  characters: readonly ReelAICharacter[];
  environment: ReelAIEnvironment;
  visualStyle: ReelAIVisualStyle;
  recurringProps: readonly string[];
  continuityRules: readonly string[];
}

/** The AUTHORED (not yet composed) half of one frame's direction --
 *  structured editorial fields only, no baked prompt text. The actual
 *  `prompt`/`negativePrompt` strings are DERIVED from these plus the
 *  shared ReelAIContinuityBible by buildComposedReelAIVisualDirection,
 *  the same "structured fields in, composed prose out" discipline
 *  reel-storyboard-content.ts's own buildComposedReelStoryboard already
 *  uses -- storing a hand-written prompt paragraph directly in this array
 *  would create a second copy of the same information to keep in sync. */
export interface ReelAIFrameDirectionEditorial {
  frame: 2 | 5;
  /** One line naming this frame's story state, e.g. "Starting state: the
   *  gift is still with the giver" / "Resolved state: the gift has been
   *  received". */
  state: string;
  visualGoal: string;
  composition: string;
  subjectAction: string;
  emotionalTone: string;
  /** Key visual details/props specific to THIS frame's moment (e.g. "the
   *  wrapped gift held close to the giver's chest" for Frame 2 vs. "the
   *  wrapped gift now held by the recipient" for Frame 5) -- the shared
   *  bible's own recurringProps cover what's identical across both
   *  frames; this covers what's different about how those same props
   *  appear in this specific frame. */
  keyVisualDetails: readonly string[];
  /** Negatives specific to this poem/frame, appended after the shared
   *  base negative-prompt list (see BASE_NEGATIVE_PROMPT_ITEMS below). */
  extraNegatives?: readonly string[];
}

export interface ReelAIVisualDirectionEditorial {
  poemNumber: number;
  continuityBible: ReelAIContinuityBible;
  frame2: ReelAIFrameDirectionEditorial;
  frame5: ReelAIFrameDirectionEditorial;
  /** One short, NEW editorial line naming the human story -- never a copy
   *  of canon.ts's simpleMeaning or reel-storyboard-content.ts's
   *  meaningLine, same "new editorial framing, not a retelling" rule
   *  those two fields already follow for their own frames. */
  storyContextLine: string;
}

/** The composed, public view of one frame's AI direction -- everything
 *  ReelAIFrameDirectionEditorial has, plus the two derived prompt
 *  strings. */
export interface ReelAIFrameDirection extends ReelAIFrameDirectionEditorial {
  prompt: string;
  negativePrompt: string;
}

export interface ComposedReelAIVisualDirection {
  poemNumber: number;
  continuityBible: ReelAIContinuityBible;
  frame2: ReelAIFrameDirection;
  frame5: ReelAIFrameDirection;
  /** Computed, not authored -- built directly from continuityBible plus
   *  the live storyboard's own emotionalMovement (read, never duplicated;
   *  see buildContinuityStatement below), so it can never drift out of
   *  sync with either. */
  continuityStatement: string;
}

/** Section 14's negative-prompt list, applied to every frame of every
 *  poem before any poem/frame-specific extras. */
const BASE_NEGATIVE_PROMPT_ITEMS: readonly string[] = [
  "text",
  "captions",
  "typography",
  "logos",
  "watermarks",
  "UI elements",
  "split screen",
  "collage",
  "duplicate people",
  "extra fingers",
  "deformed hands",
  "artificial facial expressions",
  "plastic skin",
  "overly cinematic fantasy effects",
  "oversaturated colors",
  "generic stock-photo appearance",
  "cultural stereotypes",
  "exoticized poverty",
  "modern objects inconsistent with the setting",
  "inconsistent clothing",
  "different character appearance between frames",
];

/** Section 12's own guidance, applied to every poem -- what "authentic"
 *  means here and what to avoid it with, stated once rather than
 *  repeated per poem. Each poem's own environment.culturalContext adds
 *  the poem-specific detail this general rule doesn't cover. */
const CULTURAL_AUTHENTICITY_BASE_GUIDANCE =
  "Authentic present-day Tamil / South Indian cultural context, conveyed naturally through clothing, architecture, food and vessels, landscape, and everyday social setting -- not through added ethnic props, exaggerated \"ancient India\" styling, fantasy costuming, unrelated temple imagery, or Bollywood-style staging. Ordinary contemporary life, not a historical reenactment.";

const MEDIUM_LABEL: Record<ReelAIVisualMedium, string> = {
  "cinematic-photography": "Cinematic photography",
  "editorial-photography": "Premium editorial photography",
  "cinematic-illustration": "Cinematic illustration (photoreal rendering, not cartoon or fantasy-art style)",
};

/** Strips a leading `"<semanticId>: "` tag (see ReelAIContinuityBible's
 *  own doc comment on recurringProps) before the text reaches an actual
 *  prompt -- the id is an internal anchor for reel-ai-visual-direction-
 *  qa.ts, never something an image generator should see. */
function stripSemanticTag(prop: string): string {
  const colonIndex = prop.indexOf(":");
  if (colonIndex === -1) return prop;
  const tag = prop.slice(0, colonIndex).trim();
  if (!/^[a-zA-Z]+$/.test(tag)) return prop;
  return prop.slice(colonIndex + 1).trim();
}

function formatCharacterLine(character: ReelAICharacter): string {
  const age = character.ageRange ? `${character.ageRange}, ` : "";
  const relationship = character.relationship ? ` Relationship: ${character.relationship}.` : "";
  return `${character.role} -- ${age}${character.appearance}. Wearing: ${character.clothing}.${relationship}`;
}

function buildFramePrompt(
  editorial: ReelAIVisualDirectionEditorial,
  frame: ReelAIFrameDirectionEditorial,
  otherFrameNumber: 2 | 5
): string {
  const bible = editorial.continuityBible;
  const propsText = bible.recurringProps.map(stripSemanticTag).join(", ");
  const charactersText = bible.characters.map(formatCharacterLine).join("\n");
  const negative = buildNegativePromptText(frame);

  return [
    "Create a vertical 9:16 cinematic editorial image.",
    "",
    "STORY CONTEXT",
    editorial.storyContextLine,
    "",
    "SUBJECTS",
    charactersText,
    "",
    "SETTING",
    `${bible.environment.location}. ${bible.environment.period}, ${bible.environment.timeOfDay}. ${bible.environment.atmosphere}`,
    "",
    "VISUAL CONTINUITY",
    `This is one of two images in the same visual story -- Frame ${otherFrameNumber} shows the exact same people, the exact same location, the exact same lighting and time of day, the exact same clothing, and the exact same key props (${propsText}). Every physical detail of the people and the setting must match the other frame precisely; only the story state below should differ.`,
    "",
    "FRAME STATE",
    frame.state,
    "",
    "COMPOSITION",
    frame.composition,
    "",
    "SUBJECT ACTION",
    frame.subjectAction,
    "",
    "EMOTION",
    frame.emotionalTone,
    "",
    "VISUAL STYLE",
    `${MEDIUM_LABEL[bible.visualStyle.medium]}. ${bible.visualStyle.cameraLanguage} ${bible.visualStyle.lighting} ${bible.visualStyle.colorPalette} ${bible.visualStyle.realism}`,
    "",
    "CULTURAL AUTHENTICITY",
    `${bible.environment.culturalContext} ${CULTURAL_AUTHENTICITY_BASE_GUIDANCE}`,
    "",
    "IMPORTANT VISUAL DETAILS",
    frame.keyVisualDetails.map((detail) => `- ${stripSemanticTag(detail)}`).join("\n"),
    "",
    "AVOID",
    negative,
    "",
    "The image must communicate the story visually without requiring text. No typography, captions, labels, logos, UI, watermark, or graphic overlay.",
  ].join("\n");
}

function buildNegativePromptText(frame: ReelAIFrameDirectionEditorial): string {
  const items = [...BASE_NEGATIVE_PROMPT_ITEMS, ...(frame.extraNegatives ?? [])];
  return items.join(", ") + ".";
}

/** Computed, never authored -- see ComposedReelAIVisualDirection's own
 *  doc comment. Reads emotionalMovement live from the SAME composed
 *  storyboard the sidebar's Story Arc panel already reads (Phase 8A), so
 *  this statement can never say something Phase 8A's own data disagrees
 *  with. */
function buildContinuityStatement(bible: ReelAIContinuityBible, storyboard: ComposedReelStoryboard): string {
  const characterRoles = bible.characters.map((c) => c.role).join(", ");
  const propsText = bible.recurringProps.map(stripSemanticTag).join(", ");
  const arc = storyboard.frame2Scene.emotionalMovement || storyboard.frame5Scene.emotionalMovement;
  return `Frame 2 and Frame 5 depict the exact same people (${characterRoles}), in the exact same location (${bible.environment.location}), under the exact same lighting and time of day, with the exact same key props (${propsText}) -- only the story state changes, following this poem's own arc: ${arc}.`;
}

export const PURANANURU_REEL_AI_VISUAL_DIRECTION: readonly ReelAIVisualDirectionEditorial[] = [
  {
    poemNumber: 91,
    storyContextLine:
      "Someone finally holds something rare and precious -- and chooses to give it to another person who needs it more, rather than keep it for themselves.",
    continuityBible: {
      characters: [
        {
          id: "primaryFigure",
          role: "The giver",
          ageRange: "mid-30s to mid-40s",
          appearance: "Tamil South Indian adult, warm brown skin tone, dark hair, an open and thoughtful expression",
          clothing: "simple contemporary everyday clothing -- a plain cotton shirt or kurta in a muted earth tone",
          relationship: "a neighbor or friend of the second figure, not necessarily family",
        },
        {
          id: "secondaryFigure",
          role: "The recipient",
          ageRange: "60s-70s, an elder",
          appearance: "Tamil South Indian elder, silver-grey hair, a lined and gently weary face, dignified bearing",
          clothing: "simple, well-worn cotton clothing in soft faded colors -- a plain veshti or a modest cotton saree",
          relationship: "an elder in the same neighborhood, cared for but not personally wealthy",
        },
      ],
      environment: {
        location: "the covered front step and threshold of a modest South Indian home, opening onto a quiet residential lane",
        period: "present day",
        timeOfDay: "late afternoon, warm golden light",
        atmosphere: "quiet, unhurried, an ordinary day with no festival or special occasion",
        culturalContext:
          "Everyday contemporary Tamil Nadu domestic life -- a lived-in home threshold, not a staged or ceremonial setting.",
      },
      visualStyle: {
        medium: "editorial-photography",
        cameraLanguage:
          "Medium shot at eye level, shallow depth of field, vertical 9:16 framing that uses the doorway threshold as a natural frame-within-a-frame.",
        lighting: "Warm, low-angle natural sunlight from one side, soft naturally falling shadows.",
        colorPalette: "Warm, restrained earth tones -- terracotta, muted ochre, soft browns -- never oversaturated.",
        realism: "Photorealistic documentary realism, natural skin texture, unposed candid body language.",
      },
      recurringProps: [
        "giftObject: a small object wrapped in cloth or held cupped in both hands -- the rare gift, never shown clearly enough to read as any one specific item, its preciousness communicated by how carefully it is held",
        "the home's doorway threshold, worn stone or wood",
        "a woven basket or plain brass vessel resting nearby, part of the everyday scene",
      ],
      continuityRules: [
        "Both figures keep the exact same faces, ages, builds, and clothing in both frames.",
        "The doorway, the lane, and the light stay exactly the same in both frames.",
        "The gift object itself never changes in appearance -- only who is holding it.",
      ],
    },
    frame2: {
      frame: 2,
      state: "Starting state: the gift is still with the giver, and a visible distance still separates the two figures.",
      visualGoal:
        "Communicate a meaningful, precious object, a giver and a recipient, and a gentle hesitation or anticipation -- without making the object itself the center of the image.",
      composition:
        "The giver stands near the threshold, the gift held close to their chest or cupped protectively in both hands. The elder stands a few steps away, at the edge of the frame or just beyond the threshold, facing the giver. A clear, readable gap of open space separates them -- composed so the eye reads the distance as easily as the two people.",
      subjectAction:
        "The giver pauses at the doorway, still holding the gift, caught in a moment of quiet hesitation before deciding to cross the distance. The elder looks toward the giver, waiting, not reaching out.",
      emotionalTone: "Quiet anticipation and gentle hesitation -- warm, not sad or tense.",
      keyVisualDetails: [
        "giftObject held close to the giver's own body, not yet extended toward the elder",
        "a clear band of open space between the two figures",
        "soft, natural late-afternoon light picking out both faces evenly",
      ],
    },
    frame5: {
      frame: 5,
      state: "Resolved state: the gift has been received, and the earlier distance has closed.",
      visualGoal:
        "Show the SAME two people, in the SAME place, now visibly closer -- the object has changed hands and the relationship has warmed.",
      composition:
        "The same two figures now stand close together at the same threshold. The gift is now held by the elder. The open space that separated them in the earlier moment has closed to a natural, comfortable conversational distance.",
      subjectAction:
        "The elder now holds the gift; a small, natural gesture of connection passes between the two -- a light touch on the arm, or simply sustained eye contact and a small, genuine smile.",
      emotionalTone: "Warmth and quiet relief -- the tension of the earlier moment has resolved into ease.",
      keyVisualDetails: [
        "giftObject now held by the elder, in the same wrapped/cupped form as before",
        "the earlier gap between the two figures now closed",
        "the same golden late-afternoon light, unchanged from the first frame",
      ],
      extraNegatives: ["a new or different object appearing in place of the original gift", "a transactional or staged handoff pose"],
    },
  },
  {
    poemNumber: 189,
    storyContextLine:
      "At a shared table, one portion is visibly more generous than the other -- and then the food is shared until both portions are comparable.",
    continuityBible: {
      characters: [
        {
          id: "leftColumn",
          role: "The first neighbor",
          ageRange: "30s-50s",
          appearance: "Tamil South Indian adult, everyday appearance, relaxed and unremarkable in dress or bearing",
          clothing: "simple, ordinary contemporary clothing -- plain and modest, matching the other figure's register exactly",
          relationship: "a neighbor or community member sharing the same table",
        },
        {
          id: "rightColumn",
          role: "The second neighbor",
          ageRange: "30s-50s",
          appearance: "Tamil South Indian adult, everyday appearance, relaxed and unremarkable in dress or bearing",
          clothing: "simple, ordinary contemporary clothing -- plain and modest, matching the other figure's register exactly",
          relationship: "a neighbor or community member sharing the same table",
        },
      ],
      environment: {
        location: "a simple home kitchen table, or a modest shared community dining setting",
        period: "present day",
        timeOfDay: "midday, soft indirect daylight through a window or open doorway",
        atmosphere: "an ordinary, unhurried shared meal -- domestic, not a special occasion or public charity event",
        culturalContext:
          "An everyday South Indian home-cooked meal -- banana leaf or plain steel plates, simple rice-and-curry style food.",
      },
      visualStyle: {
        medium: "editorial-photography",
        cameraLanguage:
          "Overhead-leaning three-quarter angle that reads both plates/leaves clearly within the same frame, vertical 9:16 framing, shallow depth of field on the food and hands.",
        lighting: "Soft, even natural daylight, no harsh shadows.",
        colorPalette: "Warm, natural food tones against a plain table surface -- restrained, not styled like an advertisement.",
        realism: "Photorealistic, candid, home-cooked and lived-in rather than plated for a photoshoot.",
      },
      recurringProps: [
        "two banana leaves or plain steel plates on the same table",
        "simple home-cooked South Indian food -- rice, a vegetable curry, a small side",
        "a plain shared table surface, unremarkable",
      ],
      continuityRules: [
        "Both people keep the exact same faces, ages, builds, and clothing in both frames -- their appearance never signals which one has more or less.",
        "The table, the room, and the light stay exactly the same in both frames.",
        "The difference between the two people is shown ONLY through the food on their plates, never through their clothing or visible wealth.",
      ],
    },
    frame2: {
      frame: 2,
      state: "Starting state: one plate is generously full, the other is sparse, and both people have just noticed the difference.",
      visualGoal: "Communicate an unequal distribution -- one side visibly has more, the other visibly has less -- without turning either person into a class stereotype.",
      composition:
        "Both plates are visible in the same frame, side by side on the shared table. One plate/leaf is heaped generously; the other holds a noticeably smaller portion. Both people are seated at the table, looking down at the plates rather than at each other.",
      subjectAction: "Both people pause, glancing at the visible difference in portions -- a quiet moment of noticing, not accusation or shame.",
      emotionalTone: "Quiet, neutral awareness -- observational, not guilty or resentful.",
      keyVisualDetails: [
        "one plate/leaf heaped generously, the other with a visibly smaller, plainer portion",
        "both plates fully visible within the same frame",
        "both people's hands resting near their own plate, not yet reaching toward the other's",
      ],
    },
    frame5: {
      frame: 5,
      state: "Resolved state: food has been shared between the two plates, and the visible imbalance has reduced.",
      visualGoal: "Show the SAME two people, at the SAME table, now with visibly comparable portions -- balance restored through an ordinary, unremarkable act of sharing.",
      composition:
        "The same two plates, now visibly closer in quantity -- some food has moved from the fuller plate to the sparser one. Both people are now eating together, more relaxed, occasionally glancing at each other rather than only at the food.",
      subjectAction: "One person's hand is mid-motion, having just moved a portion of food from their own plate to the other's -- a small, natural, everyday gesture, not a ceremonial or performative one.",
      emotionalTone: "Warm and companionable -- an ordinary shared meal, ease rather than obligation.",
      keyVisualDetails: [
        "the two portions now visibly closer in quantity than before",
        "a small amount of food visibly mid-transfer between the two plates",
        "the same soft midday light and table setting, unchanged from the first frame",
      ],
      extraNegatives: [
        "a donation, charity, or NGO-style framing",
        "one person depicted as visibly poorer or of lower status through clothing, posture, or setting",
        "a formal handout or transactional gesture",
      ],
    },
  },
  {
    poemNumber: 192,
    storyContextLine:
      "A newcomer stands just outside a small evening gathering of neighbors -- watching rather than taking part -- until they are drawn naturally into the group.",
    continuityBible: {
      characters: [
        {
          id: "isolatedFigure",
          role: "The newcomer",
          ageRange: "20s-40s",
          appearance: "Tamil South Indian adult, ordinary contemporary appearance, alert but slightly uncertain posture",
          clothing: "simple, ordinary contemporary clothing, unremarkable and consistent with the group's own dress",
          relationship: "not yet acquainted with the gathered neighbors",
        },
        {
          id: "communityGroup",
          role: "A small group of neighbors gathered together",
          ageRange: "mixed ages, adults and at least one elder",
          appearance: "3-4 Tamil South Indian neighbors of mixed ages and builds, relaxed and familiar with one another",
          clothing: "simple, ordinary contemporary clothing, consistent with an everyday evening gathering, not festival dress",
          relationship: "an established, familiar neighborhood group",
        },
      ],
      environment: {
        location: "an open courtyard or veranda where neighbors have gathered for the evening",
        period: "present day",
        timeOfDay: "early evening, warm fading light",
        atmosphere: "relaxed, communal, unhurried -- an ordinary evening gathering, not a festival or religious occasion",
        culturalContext:
          "An everyday South Indian neighborhood gathering -- neighbors sitting together on a veranda or courtyard, chatting, sharing tea or a simple snack.",
      },
      visualStyle: {
        medium: "editorial-photography",
        cameraLanguage:
          "Wide-leaning medium shot, vertical 9:16 framing, camera at seated eye level so the group's own sightline is legible.",
        lighting: "Warm, low, fading evening light, soft and natural, with a hint of ambient warm light from a doorway or lamp.",
        colorPalette: "Warm dusk tones -- amber, soft browns, muted greens -- restrained and natural, not stylized.",
        realism: "Photorealistic, candid documentary realism, natural and unposed body language throughout.",
      },
      recurringProps: [
        "a low courtyard wall, veranda step, or threshold marking the edge of the gathering",
        "simple woven mats, plastic chairs, or a low bench the group is seated on",
        "a shared kettle, tumbler, or plate of a simple snack being passed among the group",
      ],
      continuityRules: [
        "The newcomer and every member of the group keep the exact same faces, ages, and clothing in both frames.",
        "The courtyard, the seating, and the evening light stay exactly the same in both frames.",
        "No new person joins or leaves the group between the two frames -- only the newcomer's position relative to it changes.",
      ],
    },
    frame2: {
      frame: 2,
      state: "Starting state: the newcomer is physically and socially outside the group, watching rather than participating.",
      visualGoal: "Communicate one person outside a social gathering, with visible negative space between them and the group, observing rather than joining in.",
      composition:
        "The group is seated together, engaged with one another, occupying roughly one side or the back of the frame. The newcomer stands alone at the edge of the courtyard or just past the threshold, with a clear, readable gap of open space between them and the seated group.",
      subjectAction: "The newcomer watches the group from a slight distance, body language slightly closed or uncertain -- not approaching, not turning away. The group continues its own conversation, unaware of or not yet engaging with the newcomer.",
      emotionalTone: "Quiet observation and mild uncertainty -- subtle, not exaggerated or melodramatic.",
      keyVisualDetails: [
        "a clear band of open space between the newcomer and the seated group",
        "the newcomer standing while the group remains seated, reinforcing the separation",
        "warm evening light falling evenly across both the newcomer and the group",
      ],
    },
    frame5: {
      frame: 5,
      state: "Resolved state: the SAME newcomer is now naturally integrated into the SAME group, in the SAME courtyard.",
      visualGoal: "Show the identical person, environment, clothing, and lighting as Frame 2 -- but the negative space has closed and the newcomer is now seated with and participating in the group.",
      composition:
        "The same group, in the same courtyard, now with the newcomer seated among them -- part of the same cluster rather than separated from it. The earlier open gap has closed; the newcomer now occupies the space that was empty in the first frame.",
      subjectAction: "The newcomer is now seated with the group, engaged in the same conversation -- perhaps accepting a cup or a small snack being passed to them, a small natural gesture of inclusion rather than a dramatic welcome.",
      emotionalTone: "Warm, quiet belonging -- understated, natural, no exaggerated celebration.",
      keyVisualDetails: [
        "the earlier gap between the newcomer and the group now closed",
        "the newcomer seated at the same eye level as the rest of the group",
        "the same warm evening light and courtyard setting, unchanged from the first frame",
      ],
      extraNegatives: ["an exaggerated welcome gesture (applause, group hug, dramatic embrace)", "flags, maps, or overt \"world peace\" symbolism"],
    },
  },
];

export function getReelAIVisualDirectionEditorial(poemNumber: number): ReelAIVisualDirectionEditorial | undefined {
  return PURANANURU_REEL_AI_VISUAL_DIRECTION.find((e) => e.poemNumber === poemNumber);
}

/** Derives the composed, prompt-bearing view from an already-composed
 *  ComposedReelStoryboard -- reused, not recomputed: same "read the live
 *  composed object, never a second copy" discipline every other Reel
 *  Storyboard builder in this codebase already follows. Returns null when
 *  no AI Visual Direction has been authored yet for this poem number,
 *  same honest-fallback convention buildComposedReelStoryboard itself
 *  uses. */
export function buildComposedReelAIVisualDirection(storyboard: ComposedReelStoryboard | null): ComposedReelAIVisualDirection | null {
  if (!storyboard) return null;
  const editorial = getReelAIVisualDirectionEditorial(storyboard.poemNumber);
  if (!editorial) return null;

  const frame2: ReelAIFrameDirection = {
    ...editorial.frame2,
    prompt: buildFramePrompt(editorial, editorial.frame2, 5),
    negativePrompt: buildNegativePromptText(editorial.frame2),
  };
  const frame5: ReelAIFrameDirection = {
    ...editorial.frame5,
    prompt: buildFramePrompt(editorial, editorial.frame5, 2),
    negativePrompt: buildNegativePromptText(editorial.frame5),
  };

  return {
    poemNumber: storyboard.poemNumber,
    continuityBible: editorial.continuityBible,
    frame2,
    frame5,
    continuityStatement: buildContinuityStatement(editorial.continuityBible, storyboard),
  };
}
