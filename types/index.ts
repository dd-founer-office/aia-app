// Types mirroring the locked Sprint 1 database schema:
// users, contributors, aram_journeys, participations, causes, participation_causes
//
// Source: Database Architecture Review (six tables confirmed for Sprint 1).
// Allocation / Opportunity / Execution entities are Phase 2 and intentionally
// excluded here.

export type StageName = "vidhai" | "thulir" | "kandru" | "maram" | "vanam";

export const STAGE_LABELS: Record<StageName, { emoji: string; en: string; ta: string }> = {
  vidhai: { emoji: "🌱", en: "Vidhai", ta: "விதை" },
  thulir: { emoji: "🌿", en: "Thulir", ta: "துளிர்" },
  kandru: { emoji: "🌳", en: "Kandru", ta: "கன்று" },
  maram: { emoji: "🌳", en: "Maram", ta: "மரம்" },
  vanam: { emoji: "🌲", en: "Vanam", ta: "வனம்" },
};

export const STAGE_ORDER: StageName[] = ["vidhai", "thulir", "kandru", "maram", "vanam"];

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Contributor {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
}

export interface AramJourney {
  id: string;
  contributor_id: string;
  current_stage: StageName;
  // Continuity is displayed as given mock data, not computed --
  // the locked continuity rule has not yet been retrieved from the Product OS.
  continuity_month_count: number;
  last_participation_month: string | null; // e.g. "2026-06"
  created_at: string;
  updated_at: string;
}

export type ParticipationStatus = "completed" | "pending" | "skipped";

export interface Participation {
  id: string;
  contributor_id: string;
  month: string; // "2026-06"
  status: ParticipationStatus;
  amount: number;
  created_at: string;
}

export interface Cause {
  id: string;
  name: string;
  slug: "education" | "medical" | "annadhanam" | "environment";
}

export interface ParticipationCause {
  id: string;
  participation_id: string;
  cause_id: string;
  allocation_amount: number;
}
