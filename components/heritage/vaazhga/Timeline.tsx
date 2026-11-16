"use client";

import { Check, Flame, Gift, HandHeart, Package, Route, Truck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import type { StepKey, TimelineStep } from "@/lib/heritage/vaazhga-timeline";
import s from "./report.module.css";
import t from "./timeline.module.css";

const ICONS: Record<StepKey, LucideIcon> = {
  received: HandHeart,
  blessed: Flame,
  packed: Package,
  shipped: Truck,
  transit: Route,
  delivered: Gift,
};

/**
 * The prasadam journey as a row of circles: done steps are orange ticks, the
 * current step is the large dark circle, the rest are plain white. Tapping a
 * circle shows that step's title and line underneath.
 */
export function Timeline({ steps, current, heading }: { steps: TimelineStep[]; current: number; heading?: string }) {
  const [selected, setSelected] = useState(current);
  const shown = steps[selected] ?? steps[current];

  return (
    <div className={t.box}>
      {heading ? <h3 className={`${s.cal} ${t.heading}`}>{heading}</h3> : null}
      <ol className={t.row} aria-label="Prasadam journey">
        {steps.map((step, i) => {
          const Icon = ICONS[step.key];
          const state = i === current ? "current" : step.done ? "done" : "pending";
          return (
            <li key={step.key}>
              <button
                type="button"
                className={`${t.dot} ${t[state]} ${i === selected ? t.selected : ""}`}
                aria-label={`${step.title}: ${step.status}`}
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
              >
                {state === "done" ? <Check size={18} strokeWidth={3} /> : <Icon size={state === "current" ? 28 : 20} strokeWidth={2} />}
              </button>
            </li>
          );
        })}
      </ol>
      <div aria-live="polite">
        <p className={`${t.status} ${shown.done ? t.statusDone : ""}`}>{shown.status}</p>
        <h3 className={`${s.cal} ${t.title}`}>{shown.title}</h3>
        <p className={t.text}>{shown.text}</p>
        {shown.meta ? <p className={t.meta}>{shown.meta}</p> : null}
      </div>
    </div>
  );
}
