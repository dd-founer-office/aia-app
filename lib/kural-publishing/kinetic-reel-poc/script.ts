/**
 * Kinetic Typography Reel — Phase 1 Proof of Concept — Script
 * ----------------------------------------------------------------------------
 * Founder-approved Tamil copy for the four-stage emotional progression
 * (Fear -> Burden -> Release -> Belonging), reproduced verbatim. Never
 * rewritten, translated, or auto-generated -- this file holds the exact
 * text and timing the founder specified, nothing else.
 *
 * Isolated under kinetic-reel-poc/ on purpose: this proof of concept does
 * not touch content-types.ts, KuralHeroCanvas.tsx, or any of the five
 * existing Asset Generator templates.
 */

export type KineticReelMood = "forceful" | "release" | "stillness";

export interface KineticReelStage {
  id: string;
  label: string;
  /** Seconds from the start of the Reel. */
  startSec: number;
  endSec: number;
  /** Each entry is one authored line, exactly as given -- a hard line
   *  break, never merged with another line. A line may still be *visually*
   *  soft-wrapped across more than one row at render time if it doesn't
   *  fit the safe width; that's a layout detail, not a copy change. */
  lines: readonly string[];
  mood: KineticReelMood;
}

export const KINETIC_REEL_DURATION_SEC = 12.5;

export const KINETIC_REEL_STAGES: readonly KineticReelStage[] = [
  {
    id: "fear",
    label: "Fear",
    startSec: 0,
    endSec: 2.8,
    lines: ["நம் மொழியைக் காப்பாற்ற வேண்டும்...", "என்ற நம் பயம்,"],
    mood: "forceful",
  },
  {
    id: "burden",
    label: "Burden",
    startSec: 2.8,
    endSec: 5.8,
    lines: ["அறியாமலேயே, பிள்ளைகளின் தோள்களில்", "ஒரு பெரிய பொறுப்பாகிவிடுகிறது."],
    mood: "forceful",
  },
  {
    id: "release",
    label: "Release",
    startSec: 5.8,
    endSec: 8.8,
    lines: ["அவர்கள் ஒரு பாரம்பரியத்தின் பாதுகாவலர்கள் அல்ல;", "அதன் அன்பை அனுபவிக்க வந்தவர்கள்."],
    mood: "release",
  },
  {
    id: "belonging",
    label: "Belonging",
    startSec: 8.8,
    endSec: 12.5,
    lines: ["தமிழ் நம் பிள்ளைகளுக்குச்", "சுமையாக அல்ல,", "சொந்தமாக இருக்கட்டும்."],
    mood: "stillness",
  },
];
