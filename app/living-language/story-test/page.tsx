"use client";

/**
 * Living Language Story — Dev Proof Route (v0.3)
 * ----------------------------------------------------------------------------
 * Dedicated, explicitly opt-in development route:
 *   LIVING FIELD -> வாழ்த்து -> LIVING FIELD
 *
 * Deliberately reuses the SAME LivingFieldEngine instance the root layout's
 * <LivingField /> already mounted, via the same engine-registry.ts bridge
 * the Ambient Language Layer uses -- rather than creating a second,
 * duplicate canvas. Two reasons:
 *
 *   1. The current Living Field is the visual source of truth (explicit
 *      direction) -- reusing the real, production engine and config is a
 *      more faithful proof than reconstructing a second one from scratch.
 *   2. <LivingField /> is never modified by this route. It has no idea a
 *      story-test page exists; this page only ever CALLS INTO the engine
 *      instance that already exists, through read/write methods that are
 *      no-ops for every other page (see engine.ts's own header).
 *
 * v0.3 adds dev-only tuning sliders for all six phase durations and the
 * ambient dim factor -- explicitly NOT production UI, gated behind this
 * route only, per direction. Sliders are read fresh at the moment Play is
 * pressed (playTextFormation's callOptions), so adjusting them between
 * plays never requires reconstructing the controller.
 */

import { useEffect, useRef, useState } from "react";
import { onLivingFieldEngineReady } from "@/lib/living-field/engine-registry";
import type { LivingFieldEngine } from "@/lib/living-field/engine";
import {
  DEFAULT_STORY_TIMING,
  DEFAULT_COMBINE_TIMING,
  DEFAULT_AMBIENT_DIM_FACTOR,
  type StoryTimingConfig,
} from "@/lib/living-field/story-bridge-types";
import {
  StoryController,
  type StoryControllerPhase,
} from "@/lib/living-language-story/story-controller";

const CONSONANT = "வ்";
const VOWEL = "ஆ";
const COMBINED = "வா";
const REMAINING_GRAPHEMES = ["ழ்", "த்", "து"];
const FULL_WORD = "வாழ்த்து";

function resolveTamilFont(): string {
  const varValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-tamil-sans")
    .trim();
  return varValue.length > 0
    ? `${varValue}, 'Noto Sans Tamil', sans-serif`
    : "'Noto Sans Tamil', sans-serif";
}

interface SliderConfig {
  key: keyof StoryTimingConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

const ASSEMBLE_TIMING_SLIDERS: SliderConfig[] = [
  { key: "awakeningMs", label: "Assemble: Awakening (ழ்/த்/து)", min: 300, max: 3000, step: 100 },
  { key: "approachingMs", label: "Assemble: Approaching", min: 500, max: 6000, step: 100 },
  { key: "formingHeroMs", label: "Assemble: Forming வாழ்த்து", min: 200, max: 2500, step: 100 },
  { key: "holdingMs", label: "Assemble: Holding வாழ்த்து", min: 500, max: 5000, step: 100 },
  { key: "releasingMs", label: "Assemble: Releasing", min: 200, max: 2500, step: 100 },
  { key: "returningMs", label: "Assemble: Returning (ழ்/த்/து + வா->micro)", min: 500, max: 6000, step: 100 },
];

const COMBINE_TIMING_SLIDERS: SliderConfig[] = [
  { key: "awakeningMs", label: "Combine: Awakening (வ்/ஆ)", min: 300, max: 3000, step: 100 },
  { key: "approachingMs", label: "Combine: Approaching micro stage", min: 500, max: 5000, step: 100 },
  { key: "formingHeroMs", label: "Combine: Forming வா", min: 200, max: 2000, step: 100 },
  { key: "holdingMs", label: "Combine: Holding வா alone", min: 400, max: 3000, step: 100 },
  { key: "releasingMs", label: "Decombine: Reveal வ்+ஆ", min: 200, max: 2000, step: 100 },
  { key: "returningMs", label: "Decombine: வ்/ஆ to true homes", min: 500, max: 4000, step: 100 },
];

export default function StoryTestPage() {
  const controllerRef = useRef<StoryController | null>(null);
  const [phase, setPhase] = useState<StoryControllerPhase>("idle");
  const [ready, setReady] = useState(false);
  const [timing, setTiming] = useState<StoryTimingConfig>(DEFAULT_STORY_TIMING);
  const [combineTiming, setCombineTiming] = useState<StoryTimingConfig>(DEFAULT_COMBINE_TIMING);
  const [ambientDimFactor, setAmbientDimFactor] = useState(DEFAULT_AMBIENT_DIM_FACTOR);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onLivingFieldEngineReady((engine: LivingFieldEngine) => {
      const controller = new StoryController(engine, {
        fontFamily: resolveTamilFont(),
        heroFontWeight: 700,
      });
      controller.setOnPhaseChange(setPhase);
      controllerRef.current = controller;
      setReady(true);
    });

    return () => {
      unsubscribe();
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  const totalMs =
    combineTiming.awakeningMs +
    combineTiming.approachingMs +
    combineTiming.formingHeroMs +
    combineTiming.holdingMs +
    timing.awakeningMs +
    timing.approachingMs +
    timing.formingHeroMs +
    timing.holdingMs +
    timing.releasingMs +
    timing.returningMs +
    combineTiming.releasingMs +
    combineTiming.returningMs;

  return (
    <main className="min-h-screen flex flex-col items-center justify-end gap-4 pb-12 px-6">
      {/* Phase/timing readout -- top-RIGHT corner, small, well clear of the
          centre stage where performers converge and the hero word forms. */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-0.5 text-xs text-neutral-500 pointer-events-none">
        <span>v0.4 · வ்+ஆ→வா→வாழ்த்து · phase: {phase}</span>
        <span className="text-neutral-400">total: {(totalMs / 1000).toFixed(1)}s</span>
      </div>

      {/* Dev-only tuning panel -- collapsed by default so it never blocks
          the visual proof; toggle lives in the top-LEFT corner, and the
          panel itself only ever occupies the left edge, never the centre,
          so it can stay open while watching Play if wanted. Explicitly
          not production UI, gated behind this route only. */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed top-4 left-4 z-10 rounded-full border border-neutral-300 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-600"
      >
        {panelOpen ? "Hide tuning ▲" : "Tuning ▼"}
      </button>

      {panelOpen && (
        <div className="fixed top-14 left-4 w-72 max-h-[75vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur px-4 py-3 flex flex-col gap-3 text-xs shadow-lg">
          <p className="text-neutral-400 font-medium">Episode A + C — Combine / Decombine</p>
          {COMBINE_TIMING_SLIDERS.map(({ key, label, min, max, step }) => (
            <label key={`combine-${key}`} className="flex flex-col gap-1">
              <span className="flex justify-between text-neutral-600">
                <span>{label}</span>
                <span>{combineTiming[key]}ms</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={combineTiming[key]}
                onChange={(e) =>
                  setCombineTiming((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
              />
            </label>
          ))}

          <p className="text-neutral-400 font-medium pt-2 border-t border-neutral-100">Episode B — Assemble</p>
          {ASSEMBLE_TIMING_SLIDERS.map(({ key, label, min, max, step }) => (
            <label key={`assemble-${key}`} className="flex flex-col gap-1">
              <span className="flex justify-between text-neutral-600">
                <span>{label}</span>
                <span>{timing[key]}ms</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={timing[key]}
                onChange={(e) =>
                  setTiming((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
              />
            </label>
          ))}

          <label className="flex flex-col gap-1 pt-2 border-t border-neutral-100">
            <span className="flex justify-between text-neutral-600">
              <span>Ambient dim factor</span>
              <span>{ambientDimFactor.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={ambientDimFactor}
              onChange={(e) => setAmbientDimFactor(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setTiming(DEFAULT_STORY_TIMING);
              setCombineTiming(DEFAULT_COMBINE_TIMING);
              setAmbientDimFactor(DEFAULT_AMBIENT_DIM_FACTOR);
            }}
            className="text-neutral-400 underline self-start"
          >
            reset sliders to defaults
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={!ready}
          onClick={() =>
            controllerRef.current?.playCombineAssemble(
              CONSONANT,
              VOWEL,
              COMBINED,
              REMAINING_GRAPHEMES,
              FULL_WORD,
              { timing, combineTiming, ambientDimFactor }
            )
          }
          className="rounded-full bg-[#328D63] text-white px-6 py-3 text-sm font-medium disabled:opacity-40"
        >
          Play
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => controllerRef.current?.reset()}
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </main>
  );
}
