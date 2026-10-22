/**
 * Kinetic Typography Reel — Phase 2 — Composition
 * ----------------------------------------------------------------------------
 * Phase 1 animated every word in a line the same way, which read as
 * generic "animated subtitles" (founder feedback). Phase 2's whole design
 * is hierarchy: ONE hero ("focal") word per line gets genuine kinetic
 * typography treatment (oversized, rotated, extruded, shadowed, racking
 * into focus); the rest of the line is a quieter supporting phrase that
 * fades in and holds still around it -- "supporting phrase, focal word,
 * supporting phrase," per the founder's own brief.
 *
 * This file NEVER retypes a word of the approved script. Each line's
 * focal word is named by its WORD INDEX into that line's own
 * whitespace-split words (script.ts is still the one and only place the
 * Tamil text itself lives), so a composition can only ever select an
 * existing word -- it cannot introduce a typo or drop one. buildStage()
 * below reconstructs prefix + [focal] + suffix for every line and throws
 * if it doesn't match the original line exactly, word for word -- a hard,
 * mechanical guarantee that the approved copy is preserved untouched.
 */

import { KINETIC_REEL_STAGES } from "./script";

export type KineticReelMood = "forceful" | "weighted" | "release" | "stillness";

export interface LineComposition {
  lineIndex: number;
  prefix: string[];
  focal: string;
  suffix: string[];
  /** Seconds from the START OF THE STAGE this line's entrance begins. */
  entryStart: number;
  entryDuration: number;
}

export interface StageComposition {
  id: string;
  mood: KineticReelMood;
  /** true (Belonging only): every line in the stage stays visible and all
   *  settle together -- "hold the final complete sentence static and
   *  readable." false (Fear/Burden/Release): only the current line is
   *  "active"; earlier lines in the SAME stage recede into a smaller,
   *  muted background plane once the next line enters -- real layered
   *  depth, and nothing ever just vanishes before it's been read. */
  cumulative: boolean;
  lines: LineComposition[];
}

function splitLine(line: string, focalIndex: number, entryStart: number, entryDuration: number, lineIndex: number): LineComposition {
  const words = line.split(/\s+/).filter(Boolean);
  if (focalIndex < 0 || focalIndex >= words.length) {
    throw new Error(`Kinetic Reel composition: focalIndex ${focalIndex} out of range for line "${line}"`);
  }
  return {
    lineIndex,
    prefix: words.slice(0, focalIndex),
    focal: words[focalIndex],
    suffix: words.slice(focalIndex + 1),
    entryStart,
    entryDuration,
  };
}

/** Throws if a composed line doesn't reconstruct the original approved
 *  line exactly, word for word. This is what makes "preserve the exact
 *  approved Tamil copy" a build-time guarantee rather than a promise. */
function assertFidelity(original: string, composed: LineComposition): void {
  const rebuilt = [...composed.prefix, composed.focal, ...composed.suffix].join(" ");
  if (rebuilt !== original.trim()) {
    throw new Error(
      `Kinetic Reel composition fidelity check failed.\n  original: "${original}"\n  rebuilt:  "${rebuilt}"`
    );
  }
}

function buildStage(
  id: string,
  mood: KineticReelMood,
  cumulative: boolean,
  focalIndices: readonly number[],
  timings: ReadonlyArray<readonly [entryStart: number, entryDuration: number]>
): StageComposition {
  const stage = KINETIC_REEL_STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Kinetic Reel composition: unknown stage id "${id}"`);
  const lines = stage.lines.map((line, i) => {
    const [entryStart, entryDuration] = timings[i];
    const composed = splitLine(line, focalIndices[i], entryStart, entryDuration, i);
    assertFidelity(line, composed);
    return composed;
  });
  return { id, mood, cumulative, lines };
}

/**
 * Focal word choice per line (word index into the line's own words) --
 * the one creative/typographic judgment call this file makes. Every
 * other word in the line still appears, in order, as supporting text.
 *
 *  fear       L0 "நம் மொழியைக் [காப்பாற்ற] வேண்டும்..."      -- the verb carrying the urgency
 *             L1 "என்ற நம் [பயம்,]"                           -- the stage's own word, fear itself
 *  burden     L0 "அறியாமலேயே, பிள்ளைகளின் [தோள்களில்]"        -- the physical image: shoulders
 *             L1 "ஒரு பெரிய [பொறுப்பாகிவிடுகிறது.]"           -- the long word IS the weight
 *  release    L0 "அவர்கள் ஒரு பாரம்பரியத்தின் [பாதுகாவலர்கள்] அல்ல;" -- what they are not
 *             L1 "அதன் [அன்பை] அனுபவிக்க வந்தவர்கள்."          -- the warm payoff: love
 *  belonging  L0 "[தமிழ்] நம் பிள்ளைகளுக்குச்"                 -- the subject of the whole piece
 *             L1 "[சுமையாக] அல்ல,"                             -- named, then negated
 *             L2 "[சொந்தமாக] இருக்கட்டும்."                    -- the stage's own word: belonging
 */
export const KINETIC_REEL_COMPOSITION: readonly StageComposition[] = [
  buildStage(
    "fear",
    "forceful",
    false,
    [2, 2],
    [
      [0.0, 0.5],
      [1.3, 0.5],
    ]
  ),
  buildStage(
    "burden",
    "weighted",
    false,
    [2, 2],
    [
      [0.0, 0.65],
      [1.5, 0.7],
    ]
  ),
  buildStage(
    "release",
    "release",
    false,
    [3, 1],
    [
      [0.0, 0.8],
      [1.6, 0.8],
    ]
  ),
  buildStage(
    "belonging",
    "stillness",
    true,
    [0, 0, 0],
    [
      [0.0, 0.8],
      [0.95, 0.8],
      [1.9, 0.8],
    ]
  ),
];
