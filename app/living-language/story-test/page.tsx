"use client";

/**
 * Living Language Story — Dev Proof Route (v0.1)
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
 * No production UI: this is a bare Play/Reset harness for inspecting the
 * mechanic itself, not a polished screen.
 */

import { useEffect, useRef, useState } from "react";
import { onLivingFieldEngineReady } from "@/lib/living-field/engine-registry";
import type { LivingFieldEngine } from "@/lib/living-field/engine";
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

export default function StoryTestPage() {
  const controllerRef = useRef<StoryController | null>(null);
  const [phase, setPhase] = useState<StoryControllerPhase>("idle");
  const [ready, setReady] = useState(false);

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-end gap-4 pb-12 px-6">
      <div className="fixed top-6 left-1/2 -translate-x-1/2 text-sm text-neutral-500">
        Living Language Story — v0.1 proof · phase: {phase}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={!ready}
          onClick={() => controllerRef.current?.playTextFormation(TARGET_TEXT)}
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
