/**
 * Purananuru Reel Storyboard — AI Visual Direction
 * ----------------------------------------------------------------------------
 * LOCKED BUILD. Translates the current Reel Storyboard content
 * (reel-storyboard-content.ts) into exactly TWO complete, copyable text
 * briefs a human can paste into an external AI image-generation tool -- NOT
 * an image-generation integration. No AI API call, no image SDK, no
 * external dependency: this file is a pure, deterministic string transform,
 * the exact same contract as aathichoodi/family-image-prompt.ts's
 * buildFamilyImagePrompt (that file's own header: "This app never generates
 * or fetches images itself... This is a deterministic text transform, not a
 * call to any model").
 *
 *   Poem -> Reel Storyboard content -> HERE -> 2 image prompts
 *
 * TWO-IMAGE ARCHITECTURE (this file's own locked decision): a reel is NOT
 * seven cinematic images, and never was meant to become one image per
 * frame. It is 2 cinematic AI images + 7 editorial frames:
 *
 *   IMAGE 1 -- serves Frame 1 (Parent Hook) and Frame 2 (Modern Child
 *              Situation), reused via crop/reframe rather than requested
 *              twice. The establishing shot: the modern child situation in
 *              its STARTING state.
 *   IMAGE 2 -- serves Frame 3 (Human Action). Visual continuity with Image
 *              1 (same child, same age, same clothing, same environment,
 *              same photographic treatment) showing the small human action
 *              that resolves Image 1's situation.
 *
 * Frames 4-7 (Tamil Discovery, Aram, How To Teach, Practise/Pass It On) are
 * pure editorial typography -- see purananuru-reel-storyboard-renderer.ts's
 * own draw functions -- and never get an AI image prompt of their own.
 *
 * OBSOLETE LOGIC REMOVED: this file previously generated one prompt per
 * Frame 2 / Frame 5 pair built around an adult giver/elder-recipient or
 * two-neighbor scene, continuity anchored to Phase 9A's now-deleted
 * ReelMotionDirection/ReelMotionTarget ("giftObject", "leftColumn", etc.),
 * and an explicit "TEACHING INTENT" block quoting the poem's teaching
 * content into the prompt. All of that is gone: motion direction no longer
 * exists in this codebase, the story's own characters are now the
 * contemporary child situation Frame 2 already establishes (not an
 * unrelated adult scene), and the teaching connection lives in Frames 4-7's
 * own editorial text, never inside an AI prompt.
 *
 * CONTINUITY: the whole reason this file exists as one shared "continuity
 * bible" per poem, rather than two independent image prompts, is that
 * Image 1 and Image 2 must read as "same child, same world, different
 * moment," never two unrelated AI-generated images. Both images' prompts
 * are built from the SAME ReelAIContinuityBible object (characters,
 * environment, visual style, recurring props) -- there is no separate
 * image1Bible/image2Bible to drift out of sync.
 *
 * EDITORIAL SCOPE: every scene below is a NEW modern situation the poem's
 * classical idea maps onto (same discipline canon.ts's own
 * visualStoryDirection field already documents: "a MODERN, contemporary
 * human situation the classical idea maps onto, not generic 'ancient Tamil
 * king' imagery"). The story's subjects are contemporary Tamil/South Indian
 * children (8-10), matching Frame 2's own "a situation a contemporary child
 * can immediately recognise" brief -- a deliberate change from earlier
 * drafts that used adult/elder or two-neighbor scenes for these same poems.
 */

import type { ComposedReelStoryboard } from "./reel-storyboard-content";

/** One of two subjects appearing in BOTH Image 1 and Image 2 -- the same
 *  child(ren), unchanged, in both images. `id` is an internal label only
 *  (for continuityRules text and human readability), never itself written
 *  into the generated prompt text, which speaks in
 *  `role`/`appearance`/`clothing` instead, exactly the way a real
 *  production continuity sheet would. */
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

/** "editorial-photography" is this dataset's one house style ("premium
 *  editorial photography") -- kept as a per-poem field, not a hardcoded
 *  constant, only because a future poem's story might genuinely call for a
 *  different medium; all three current poems use the same value on
 *  purpose, the same "one house style" discipline family-image-prompt.ts's
 *  own header documents for Aathichoodi's family photos. */
export type ReelAIVisualMedium = "cinematic-photography" | "editorial-photography" | "cinematic-illustration";

export interface ReelAIVisualStyle {
  medium: ReelAIVisualMedium;
  cameraLanguage: string;
  lighting: string;
  colorPalette: string;
  realism: string;
}

/** The one shared "world" both Image 1 and Image 2 draw from -- see this
 *  file's own header "CONTINUITY". */
export interface ReelAIContinuityBible {
  characters: readonly ReelAICharacter[];
  environment: ReelAIEnvironment;
  visualStyle: ReelAIVisualStyle;
  recurringProps: readonly string[];
  continuityRules: readonly string[];
}

/** The AUTHORED (not yet composed) half of one image's direction --
 *  structured editorial fields only, no baked prompt text. The actual
 *  `prompt`/`negativePrompt` strings are DERIVED from these plus the
 *  shared ReelAIContinuityBible by buildComposedReelAIVisualDirection,
 *  the same "structured fields in, composed prose out" discipline
 *  reel-storyboard-content.ts's own buildComposedReelStoryboard already
 *  uses -- storing a hand-written prompt paragraph directly in this array
 *  would create a second copy of the same information to keep in sync. */
export interface ReelAIImageDirectionEditorial {
  /** Which reel frame(s) this image serves, e.g. "Frames 1-2 (Parent
   *  Hook, Modern Child Situation)" -- shown in the UI and the composed
   *  prompt's own header line, never itself an image-generation
   *  instruction. */
  purpose: string;
  /** One line naming this image's story state, e.g. "Starting state: the
   *  child is apart from the group" / "Action state: a classmate invites
   *  them in". */
  state: string;
  visualGoal: string;
  composition: string;
  subjectAction: string;
  emotionalTone: string;
  /** Key visual details/props specific to THIS image's moment -- the
   *  shared bible's own recurringProps cover what's identical across both
   *  images; this covers what's different about how those same props
   *  appear in this specific image. */
  keyVisualDetails: readonly string[];
  /** Negatives specific to this poem/image, appended after the shared
   *  base negative-prompt list (see BASE_NEGATIVE_PROMPT_ITEMS below). */
  extraNegatives?: readonly string[];
}

export interface ReelAIVisualDirectionEditorial {
  poemNumber: number;
  continuityBible: ReelAIContinuityBible;
  image1: ReelAIImageDirectionEditorial;
  image2: ReelAIImageDirectionEditorial;
  /** One short, NEW editorial paragraph naming the human story -- never a
   *  copy of canon.ts's simpleMeaning or reel-storyboard-content.ts's
   *  discoveryMeaning, same "new editorial framing, not a retelling" rule
   *  those fields already follow for their own frames. */
  storyContextLine: string;
}

/** The composed, public view of one image's AI direction -- everything
 *  ReelAIImageDirectionEditorial has, plus the two derived prompt
 *  strings. */
export interface ReelAIImageDirection extends ReelAIImageDirectionEditorial {
  prompt: string;
  negativePrompt: string;
}

export interface ComposedReelAIVisualDirection {
  poemNumber: number;
  continuityBible: ReelAIContinuityBible;
  /** Exposed at this level (not just baked into image1.prompt/image2.
   *  prompt's own STORY CONTEXT section) so reel-ai-visual-direction-qa.ts
   *  and the UI's own summary can read it directly, without grepping
   *  composed prompt text for a section marker. Still authored once, on
   *  the editorial array below -- this is the same value, surfaced, never
   *  a second copy. */
  storyContextLine: string;
  image1: ReelAIImageDirection;
  image2: ReelAIImageDirection;
  /** Computed, not authored -- built directly from continuityBible, so it
   *  can never drift out of sync with it. */
  continuityStatement: string;
}

/** Applied to every image of every poem before any poem/image-specific
 *  extras. */
const BASE_NEGATIVE_PROMPT_ITEMS: readonly string[] = [
  "text",
  "captions",
  "typography",
  "logos",
  "watermarks",
  "UI elements",
  "speech bubbles",
  "dialogue graphics",
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
  "different character appearance between images",
  "exaggerated or theatrical gestures",
];

/** What "authentic" means here and what to avoid it with, stated once
 *  rather than repeated per poem. Each poem's own environment.
 *  culturalContext adds the poem-specific detail this general rule
 *  doesn't cover. */
const CULTURAL_AUTHENTICITY_BASE_GUIDANCE =
  "Authentic present-day Tamil / South Indian cultural context, conveyed naturally through clothing, architecture, and everyday setting -- not through added ethnic props, exaggerated \"ancient India\" styling, fantasy costuming, unrelated temple imagery, or Bollywood-style staging. Ordinary contemporary life, not a historical reenactment.";

const MEDIUM_LABEL: Record<ReelAIVisualMedium, string> = {
  "cinematic-photography": "Cinematic photography",
  "editorial-photography": "Premium editorial photography",
  "cinematic-illustration": "Cinematic illustration (photoreal rendering, not cartoon or fantasy-art style)",
};

function formatCharacterLine(character: ReelAICharacter): string {
  const age = character.ageRange ? `${character.ageRange}, ` : "";
  const relationship = character.relationship ? ` Relationship: ${character.relationship}.` : "";
  return `${character.role} -- ${age}${character.appearance}. Wearing: ${character.clothing}.${relationship}`;
}

function buildImagePrompt(
  editorial: ReelAIVisualDirectionEditorial,
  image: ReelAIImageDirectionEditorial,
  otherImageLabel: string
): string {
  const bible = editorial.continuityBible;
  const propsText = bible.recurringProps.join(", ");
  const charactersText = bible.characters.map(formatCharacterLine).join("\n");
  const negative = buildNegativePromptText(image);

  return [
    `Create a vertical 9:16 cinematic editorial image. Serves: ${image.purpose}.`,
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
    `This is one of two images in the same visual story -- ${otherImageLabel} shows the exact same people, the exact same location, the exact same lighting and time of day, the exact same clothing, and the exact same key props (${propsText}). Every physical detail of the people and the setting must match the other image precisely; only the story state below should differ.`,
    "",
    "FRAME STATE",
    image.state,
    "",
    "COMPOSITION",
    image.composition,
    "",
    "SUBJECT ACTION",
    image.subjectAction,
    "",
    "EMOTION",
    image.emotionalTone,
    "",
    "VISUAL STYLE",
    `${MEDIUM_LABEL[bible.visualStyle.medium]}. ${bible.visualStyle.cameraLanguage} ${bible.visualStyle.lighting} ${bible.visualStyle.colorPalette} ${bible.visualStyle.realism}`,
    "",
    "CULTURAL AUTHENTICITY",
    `${bible.environment.culturalContext} ${CULTURAL_AUTHENTICITY_BASE_GUIDANCE}`,
    "",
    "IMPORTANT VISUAL DETAILS",
    image.keyVisualDetails.map((detail) => `- ${detail}`).join("\n"),
    "",
    "AVOID",
    negative,
    "",
    "The image must communicate the story visually without requiring text. No typography, captions, labels, logos, UI, watermark, speech bubbles, or graphic overlay.",
  ].join("\n");
}

function buildNegativePromptText(image: ReelAIImageDirectionEditorial): string {
  const items = [...BASE_NEGATIVE_PROMPT_ITEMS, ...(image.extraNegatives ?? [])];
  return items.join(", ") + ".";
}

/** Computed, never authored -- see ComposedReelAIVisualDirection's own doc
 *  comment. */
function buildContinuityStatement(bible: ReelAIContinuityBible): string {
  const characterRoles = bible.characters.map((c) => c.role).join(", ");
  const propsText = bible.recurringProps.join(", ");
  return `Image 1 and Image 2 depict the exact same people (${characterRoles}), in the exact same location (${bible.environment.location}), under the exact same lighting and time of day, with the exact same key props (${propsText}) -- only the story state changes between them.`;
}

export const PURANANURU_REEL_AI_VISUAL_DIRECTION: readonly ReelAIVisualDirectionEditorial[] = [
  {
    poemNumber: 91,
    storyContextLine:
      "A child has one favourite snack left -- something they were genuinely looking forward to. They notice a friend nearby has none. The story is the small, ordinary moment of noticing, and the simple offer that follows.",
    continuityBible: {
      characters: [
        {
          id: "childWithSnack",
          role: "The child with the snack",
          ageRange: "8-10",
          appearance: "Tamil South Indian child, contemporary appearance, open and thoughtful expression",
          clothing: "ordinary contemporary school clothing",
          relationship: "a classmate or friend of the second child",
        },
        {
          id: "childWithoutSnack",
          role: "The child without a snack",
          ageRange: "8-10",
          appearance: "Tamil South Indian child, contemporary appearance, ordinary and unremarkable",
          clothing: "ordinary contemporary school clothing, matching the other child's register",
          relationship: "a classmate or friend, not necessarily close",
        },
      ],
      environment: {
        location: "a school lunch table or classroom corner",
        period: "present day",
        timeOfDay: "daytime, lunch or snack break",
        atmosphere: "an ordinary school day, no special occasion",
        culturalContext: "an everyday South Indian school snack-time setting -- realistic, not staged.",
      },
      visualStyle: {
        medium: "editorial-photography",
        cameraLanguage:
          "Medium shot at child's eye level, shallow depth of field, vertical 9:16 framing with generous negative space above/around the subject for overlaid editorial text.",
        lighting: "Warm natural daylight through a window or open doorway, soft shadows.",
        colorPalette: "Warm, natural school-day tones, restrained, not oversaturated.",
        realism: "Photorealistic documentary realism, natural unposed body language, no melodrama.",
      },
      recurringProps: [
        "a small snack or wrapped food item, held by the first child",
        "a school lunch table or bench surface",
        "school bags or books nearby, part of the everyday scene",
      ],
      continuityRules: [
        "Both children keep the exact same faces, ages, and clothing across both images.",
        "The table, the room, and the light stay exactly the same across both images.",
        "The snack itself never changes in appearance -- only who is holding it.",
      ],
    },
    image1: {
      purpose: "Frames 1-2 (Parent Hook, Modern Child Situation)",
      state: "Starting state: the snack is still with the first child, and the second child has just been noticed nearby.",
      visualGoal:
        "Communicate a child holding something they were looking forward to, and a friend nearby without one -- quiet, ordinary, not staged as a lesson.",
      composition:
        "The child with the snack sits at the table, the snack close in front of them or held loosely. The second child sits or stands a short distance away, without one, visible in the same frame. Generous negative space above/around the scene for overlaid text.",
      subjectAction:
        "The first child glances toward the second child, noticing -- hands still resting near their own snack, not yet offering it. The second child isn't asking, just present.",
      emotionalTone: "Quiet noticing -- ordinary, not sad or tense.",
      keyVisualDetails: [
        "the snack still fully with the first child, not yet extended",
        "a natural, readable distance between the two children",
        "warm daylight falling evenly across both children",
      ],
    },
    image2: {
      purpose: "Frame 3 (Human Action)",
      state: "Offering state: the first child offers the snack to the second child.",
      visualGoal:
        "Show the same two children, same table, same light -- but now the snack is mid-offer, a small natural gesture, not a staged handoff.",
      composition:
        "The same two children, now closer together at the same table. The first child holds the snack out toward the second child. The earlier distance has closed to a natural, comfortable closeness.",
      subjectAction:
        "The first child extends the snack with a simple, unforced gesture -- not dramatic, just an ordinary offer. The second child looks up, a small flicker of surprise or warmth.",
      emotionalTone: "Warm and natural -- an ordinary kindness, not a grand gesture.",
      keyVisualDetails: [
        "the snack mid-offer between the two children",
        "the same clothing, faces, and table setting as Image 1",
        "no speech bubble or text -- the gesture itself carries the moment",
      ],
      extraNegatives: ["a speech bubble or dialogue graphic", "a transactional or staged handoff pose"],
    },
  },
  {
    poemNumber: 189,
    storyContextLine:
      "A child notices they have more pencils than they need at their desk. A classmate nearby has none. The story is the small, unprompted choice to offer the extra -- not because they were asked, but because they noticed.",
    continuityBible: {
      characters: [
        {
          id: "childWithExtra",
          role: "The child with extra pencils",
          ageRange: "8-10",
          appearance: "Tamil South Indian child, contemporary appearance, relaxed and unremarkable",
          clothing: "ordinary contemporary school clothing",
          relationship: "a classmate seated nearby",
        },
        {
          id: "childWithoutExtra",
          role: "The classmate without one",
          ageRange: "8-10",
          appearance: "Tamil South Indian child, contemporary appearance, relaxed and unremarkable",
          clothing: "ordinary contemporary school clothing, matching the other child's register",
          relationship: "a classmate seated nearby",
        },
      ],
      environment: {
        location: "a classroom desk or shared school table",
        period: "present day",
        timeOfDay: "daytime, class time",
        atmosphere: "an ordinary classroom moment, no special occasion",
        culturalContext: "an everyday South Indian classroom setting -- realistic, not staged.",
      },
      visualStyle: {
        medium: "editorial-photography",
        cameraLanguage:
          "Medium shot at child's eye level, shallow depth of field on the desk and hands, vertical 9:16 framing with generous negative space for overlaid editorial text.",
        lighting: "Soft, even natural daylight through a classroom window, no harsh shadows.",
        colorPalette: "Warm, natural classroom tones, restrained, not stylized.",
        realism: "Photorealistic, candid, unposed -- an ordinary classroom moment, not a photoshoot.",
      },
      recurringProps: [
        "a small handful of pencils or pens on the desk, visibly more than one child needs",
        "a classroom desk or shared table surface",
        "notebooks or classroom materials nearby, part of the everyday scene",
      ],
      continuityRules: [
        "Both children keep the exact same faces, ages, and clothing across both images -- their appearance never signals which one has more or less.",
        "The desk, the classroom, and the light stay exactly the same across both images.",
        "The difference between the two children is shown ONLY through the pencils on the desk, never through their clothing or visible wealth.",
      ],
    },
    image1: {
      purpose: "Frames 1-2 (Parent Hook, Modern Child Situation)",
      state: "Starting state: extra pencils sit with the first child, unnoticed by them; the second child has none, visible nearby.",
      visualGoal: "Communicate an unequal, unremarked distribution -- one child visibly has more, the other visibly has none -- without turning either child into a stereotype.",
      composition:
        "The desk with several pencils is visible in the same frame as the second child's empty space where a pencil should be. Both children are seated, focused on their own work rather than each other. Generous negative space for overlaid text.",
      subjectAction: "The first child works, unaware of the extra pencils in front of them. The second child glances toward the desk, not asking, just noticing they have none.",
      emotionalTone: "Quiet, neutral awareness -- observational, not guilty or resentful.",
      keyVisualDetails: [
        "several pencils visibly bunched at the first child's own space, more than one person needs",
        "the second child's own desk space visibly empty of pencils",
        "both children's hands near their own work, not yet reaching toward the other's",
      ],
    },
    image2: {
      purpose: "Frame 3 (Human Action)",
      state: "Offering state: the first child slides an extra pencil across to the second child.",
      visualGoal: "Show the same two children, same desk, same light -- but now one pencil is mid-transfer, a small, natural, everyday gesture.",
      composition:
        "The same two children, now with one pencil visibly sliding or extended across the desk from the first child toward the second. Both children are closer, glancing at each other rather than only at their own work.",
      subjectAction: "The first child's hand is mid-motion, pushing one pencil -- just the extra, not their whole handful -- toward the second child. The second child reaches to accept it.",
      emotionalTone: "Warm and companionable -- an ordinary classroom kindness, ease rather than obligation.",
      keyVisualDetails: [
        "exactly one pencil mid-transfer between the two children, the rest still with the first child",
        "the same desk, clothing, and classroom setting as Image 1",
        "no speech bubble or text -- the gesture itself carries the moment",
      ],
      extraNegatives: [
        "a donation, charity, or NGO-style framing",
        "one child depicted as visibly poorer or of lower status through clothing, posture, or setting",
        "the first child giving away all their pencils, not just the extra",
      ],
    },
  },
  {
    poemNumber: 192,
    storyContextLine:
      "A child sits slightly apart from a group of classmates who are already playing together. The story is not the loneliness itself -- it's the small, ordinary moment when someone notices, and closes the distance with a simple invitation.",
    continuityBible: {
      characters: [
        {
          id: "isolatedChild",
          role: "The child sitting apart",
          ageRange: "8-10",
          appearance: "Tamil South Indian child, contemporary appearance, alert but slightly uncertain posture",
          clothing: "ordinary contemporary school-appropriate clothing",
          relationship: "not yet part of the group",
        },
        {
          id: "playingGroup",
          role: "A small group of classmates playing together",
          ageRange: "8-10, mixed",
          appearance: "3-4 Tamil South Indian children of similar age, relaxed and familiar with one another",
          clothing: "ordinary contemporary school or playground clothing",
          relationship: "an established group of friends",
        },
      ],
      environment: {
        location: "a contemporary school playground or courtyard",
        period: "present day",
        timeOfDay: "daytime, recess or break time",
        atmosphere: "an ordinary school day, not a special event",
        culturalContext: "an everyday South Indian school setting -- realistic, not staged.",
      },
      visualStyle: {
        medium: "editorial-photography",
        cameraLanguage:
          "Medium shot at child's eye level, shallow depth of field, vertical 9:16 framing with generous negative space above/around the subject for overlaid editorial text.",
        lighting: "Warm natural daylight, soft shadows.",
        colorPalette: "Warm, natural playground tones, restrained, not oversaturated.",
        realism: "Photorealistic documentary realism, natural unposed body language, no melodrama.",
      },
      recurringProps: [
        "a school bag or water bottle resting nearby, part of the everyday scene",
        "a low wall, bench, or step the isolated child is near",
        "a ball or simple playground equipment the group is playing with",
      ],
      continuityRules: [
        "The isolated child and every member of the group keep the exact same faces, ages, and clothing across both images.",
        "The playground, the light, and the time of day stay exactly the same across both images.",
        "No new child joins or leaves the group between the two images -- only the isolated child's position relative to it changes.",
      ],
    },
    image1: {
      purpose: "Frames 1-2 (Parent Hook, Modern Child Situation)",
      state: "Establishing state: the child is physically apart from the group, watching rather than joining in.",
      visualGoal: "Communicate one child outside a playing group, with visible space between them, observing rather than participating -- quiet, not melodramatic.",
      composition:
        "The group is playing together, occupying one side of the frame, engaged with each other. The isolated child sits or stands a short distance away, with a clear, readable gap of open space between them and the group. Generous negative space above/around the isolated child for overlaid text.",
      subjectAction: "The isolated child watches the group with a quiet, uncertain expression -- not upset, just apart. The group continues playing, unaware of or not yet noticing the isolated child.",
      emotionalTone: "Quiet observation and mild uncertainty -- subtle, ordinary, not sad or exaggerated.",
      keyVisualDetails: [
        "a clear band of open space between the isolated child and the group",
        "the isolated child's body language slightly closed, not reaching out",
        "warm daylight falling evenly across both the child and the group",
      ],
    },
    image2: {
      purpose: "Frame 3 (Human Action)",
      state: "Invitation state: a child from the group approaches the isolated child with a simple gesture of invitation.",
      visualGoal:
        "Show the same isolated child, same playground, same light -- but now a second child from the group has approached and is mid-gesture, inviting them to play. The gesture itself must naturally read as an invitation, without any text or speech bubble.",
      composition:
        "The same isolated child, now with a second child from the group standing close by, mid-gesture -- perhaps extending a hand, holding out a ball, or gesturing toward the group. The earlier gap has closed to a natural, comfortable distance.",
      subjectAction:
        "The approaching child leans in with an open, friendly gesture -- offering the ball, or simply gesturing toward the group. The isolated child looks up, a small flicker of surprise or hope crossing their face, not yet moved but clearly noticing.",
      emotionalTone: "Warm anticipation -- the moment just before an invitation is accepted, natural and unforced.",
      keyVisualDetails: [
        "a natural inviting gesture (offering a ball, an open hand, a gesture toward the group) -- never a speech bubble or text",
        "the same clothing, faces, and playground setting as Image 1",
        "the gap between the two children now nearly closed",
      ],
      extraNegatives: ["a speech bubble or dialogue graphic", "an exaggerated or theatrical welcome gesture"],
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
 *  no AI Visual Direction has been authored yet for this poem number, same
 *  honest-fallback convention buildComposedReelStoryboard itself uses. */
export function buildComposedReelAIVisualDirection(storyboard: ComposedReelStoryboard | null): ComposedReelAIVisualDirection | null {
  if (!storyboard) return null;
  const editorial = getReelAIVisualDirectionEditorial(storyboard.poemNumber);
  if (!editorial) return null;

  const image1: ReelAIImageDirection = {
    ...editorial.image1,
    prompt: buildImagePrompt(editorial, editorial.image1, "Image 2"),
    negativePrompt: buildNegativePromptText(editorial.image1),
  };
  const image2: ReelAIImageDirection = {
    ...editorial.image2,
    prompt: buildImagePrompt(editorial, editorial.image2, "Image 1"),
    negativePrompt: buildNegativePromptText(editorial.image2),
  };

  return {
    poemNumber: storyboard.poemNumber,
    continuityBible: editorial.continuityBible,
    storyContextLine: editorial.storyContextLine,
    image1,
    image2,
    continuityStatement: buildContinuityStatement(editorial.continuityBible),
  };
}
