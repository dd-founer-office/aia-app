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
  DEFAULT_AMBIENT_DIM_FACTOR,
  type StoryTimingConfig,
} from "@/lib/living-field/story-bridge-types";
import {
  StoryController,
  type StoryControllerPhase,
} from "@/lib/living-language-story/story-controller";

const TARGET_TEXT = "வாழ்த்து";

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

const TIMING_SLIDERS: SliderConfig[] = [
  { key: "awakeningMs", label: "Awakening", min: 300, max: 3000, step: 100 },
  { key: "approachingMs", label: "Approaching", min: 500, max: 6000, step: 100 },
  { key: "formingHeroMs", label: "Forming Hero", min: 200, max: 2500, step: 100 },
  { key: "holdingMs", label: "Holding", min: 500, max: 5000, step: 100 },
  { key: "releasingMs", label: "Releasing", min: 200, max: 2500, step: 100 },
  { key: "returningMs", label: "Returning", min: 500, max: 6000, step: 100 },
];

export default function StoryTestPage() {
  const controllerRef = useRef<StoryController | null>(null);
  const [phase, setPhase] = useState<StoryControllerPhase>("idle");
  const [ready, setReady] = useState(false);
  const [timing, setTiming] = useState<StoryTimingConfig>(DEFAULT_STORY_TIMING);
  const [ambientDimFactor, setAmbientDimFactor] = useState(DEFAULT_AMBIENT_DIM_FACTOR);

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
    timing.awakeningMs +
    timing.approachingMs +
    timing.formingHeroMs +
    timing.holdingMs +
    timing.releasingMs +
    timing.returningMs;

  return (
    <main className="min-h-screen flex flex-col items-center justify-end gap-4 pb-12 px-6">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-sm text-neutral-500">
        <span>Living Language Story — v0.3 proof · phase: {phase}</span>
        <span className="text-xs text-neutral-400">total: {(totalMs / 1000).toFixed(1)}s</span>
      </div>

      {/* Dev-only tuning panel -- explicitly not production UI, gated
          behind this route only. */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-72 max-h-[55vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur px-4 py-3 flex flex-col gap-3 text-xs">
        {TIMING_SLIDERS.map(({ key, label, min, max, step }) => (
          <label key={key} className="flex flex-col gap-1">
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
        <label className="flex flex-col gap-1">
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
            setAmbientDimFactor(DEFAULT_AMBIENT_DIM_FACTOR);
          }}
          className="text-neutral-400 underline self-start"
        >
          reset sliders to defaults
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={!ready}
          onClick={() =>
            controllerRef.current?.playTextFormation(TARGET_TEXT, {
              timing,
              ambientDimFactor,
            })
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
