/**
 * Types for the CA-014 Participation Flow.
 *
 * NOTE: Causes are static reference data per CA-014A UX spec §9 (offline
 * edge case) — they should ship bundled with the app rather than fetched,
 * since they change essentially never. This file is the bundled source.
 */

export type CauseId = "education" | "medical" | "annadhanam" | "environment";

export interface Cause {
  id: CauseId;
  title: string;
  description: string;
  /** Lucide icon name, resolved to a component in CauseCard. */
  icon: "BookOpen" | "HeartPulse" | "Soup" | "TreePine";
}

/** Locked copy per CA-014 v1.0 and CA-014A UX spec. */
export const CAUSES: readonly Cause[] = [
  {
    id: "education",
    title: "Education",
    description: "Support learning continuity.",
    icon: "BookOpen",
  },
  {
    id: "medical",
    title: "Medical",
    description: "Support health and wellbeing.",
    icon: "HeartPulse",
  },
  {
    id: "annadhanam",
    title: "Annadhanam",
    description: "Support nourishment and dignity.",
    icon: "Soup",
  },
  {
    id: "environment",
    title: "Environment",
    description: "Support long-term ecological wellbeing.",
    icon: "TreePine",
  },
] as const;

/**
 * In-memory / session-only selection state for the Participation Flow.
 * Nothing here is written to the backend until the Confirmation step
 * (per the Commitment domain model — Recorded happens at submission,
 * not during selection).
 *
 * totalAmountRupees / causeAllocationsRupees: founder-directed addition
 * (per-founder product decision -- the contributor enters a total amount,
 * then splits it themselves across their selected causes; that becomes the
 * "order" the backend records for AiA to execute and later publish as an
 * Act of Aram). Whole rupees only, no decimals -- avoids floating-point
 * summation issues when validating the split against the total.
 */
export interface ParticipationFlowState {
  selectedCauses: CauseId[];
  totalAmountRupees: number | null;
  causeAllocationsRupees: Partial<Record<CauseId, number>>;
}
