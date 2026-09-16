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

// CA-012 Locked v1.0's Stage System section gives each stage a short
// epithet ("The Seed", etc.) plus example meaning copy per stage (labeled
// "content style, not literal UI copy" in the spec) -- these are original
// copy written to that same style, not literal spec text except Kandru's,
// which is used verbatim from the spec's own worked example.
export const STAGE_EPITHETS: Record<StageName, string> = {
  vidhai: "The Seed",
  thulir: "The Sprout",
  kandru: "The Sapling",
  maram: "The Mature Tree",
  vanam: "The Forest",
};

export const STAGE_MEANINGS: Record<StageName, string> = {
  vidhai: "The first seed has been planted — your practice of Aram is just beginning.",
  thulir: "A first pattern is forming — your practice is starting to take root.",
  kandru: "Roots are forming and participation is becoming a habit.",
  maram: "Your practice of Aram has matured into a steady, dependable rhythm.",
  vanam: "Your practice now shelters others — a forest grown from years of steady roots.",
};

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
  // Continuity + stage progression are computed server-side by the
  // apply_participation_to_journey() trigger function (Sprint 1 Tasks 7-8),
  // not derived on read -- these columns are the source of truth.
  continuity_month_count: number;
  longest_continuity_month_count: number;
  longest_continuity_reached_at: string | null;
  last_participation_month: string | null; // e.g. "2026-06"
  thulir_reached_at: string | null;
  kandru_reached_at: string | null;
  maram_reached_at: string | null;
  vanam_reached_at: string | null;
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
