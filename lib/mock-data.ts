import {
  AramJourney,
  Cause,
  Contributor,
  Participation,
  ParticipationCause,
  User,
} from "@/types";

// Mock data only -- to be replaced with Supabase queries once integration
// begins (per Frontend Architecture section 8: mock data first, Supabase after UI
// approval). Shaped to match the locked six-table Sprint 1 schema exactly,
// so swapping in real queries later is a data-fetching change only.

export const mockUser: User = {
  id: "user_1",
  email: "suresh@example.com",
  full_name: "Suresh",
  created_at: "2025-11-02T00:00:00Z",
};

export const mockContributor: Contributor = {
  id: "contributor_1",
  user_id: mockUser.id,
  display_name: "Suresh",
  created_at: "2025-11-02T00:00:00Z",
};

export const mockJourney: AramJourney = {
  id: "journey_1",
  contributor_id: mockContributor.id,
  current_stage: "thulir",
  continuity_month_count: 3,
  last_participation_month: "2026-05",
  created_at: "2025-11-02T00:00:00Z",
  updated_at: "2026-05-30T00:00:00Z",
};

export const mockCauses: Cause[] = [
  { id: "cause_education", name: "Education", slug: "education" },
  { id: "cause_medical", name: "Medical", slug: "medical" },
  { id: "cause_annadhanam", name: "Annadhanam", slug: "annadhanam" },
  { id: "cause_environment", name: "Environment", slug: "environment" },
];

export const mockParticipations: Participation[] = [
  {
    id: "participation_2026_06",
    contributor_id: mockContributor.id,
    month: "2026-06",
    status: "pending",
    amount: 0,
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "participation_2026_05",
    contributor_id: mockContributor.id,
    month: "2026-05",
    status: "completed",
    amount: 1500,
    created_at: "2026-05-03T00:00:00Z",
  },
  {
    id: "participation_2026_04",
    contributor_id: mockContributor.id,
    month: "2026-04",
    status: "completed",
    amount: 1000,
    created_at: "2026-04-04T00:00:00Z",
  },
];

export const mockParticipationCauses: ParticipationCause[] = [
  {
    id: "pc_1",
    participation_id: "participation_2026_05",
    cause_id: "cause_education",
    allocation_amount: 1500,
  },
  {
    id: "pc_2",
    participation_id: "participation_2026_04",
    cause_id: "cause_annadhanam",
    allocation_amount: 1000,
  },
];

// Convenience accessor for the current month's participation -- a small
// derivation over already-given mock fields, not stage/continuity logic.
export function getCurrentMonthParticipation(): Participation | undefined {
  const currentMonth = "2026-06";
  return mockParticipations.find((p) => p.month === currentMonth);
}

// -----------------------------------------------------------------------
// Presentation-only mock data for the Home "Your Latest Act of Aram"
// Evidence Card. Act of Aram is NOT part of the locked six-table Sprint 1
// schema (see types/index.ts header comment) -- this exists purely for UI
// and design validation while that entity doesn't exist yet. This is not
// a schema addition: no table, no migration, no Supabase model. Replace
// with a live query once Act of Aram ships as a real entity.
// -----------------------------------------------------------------------
export interface MockLatestAct {
  cause: string;
  location: string;
  impact_summary: string;
  completed_date: string; // display string, e.g. "12 June 2026"
  hero_image_url: string;
}

export const mockLatestAct: MockLatestAct = {
  cause: "Education",
  location: "Tirunelveli, Tamil Nadu",
  impact_summary: "12 students received school kits.",
  completed_date: "12 June 2026",
  hero_image_url:
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
};

// -----------------------------------------------------------------------
// Presentation-only mock data for the Home "குறள் கூறும் அறம்" section.
// Mirrors the shape of the future Founder Intelligence Kural Koorum Aram
// knowledge engine (FI-DB-003, record KKA-001) so the UI can later read
// live data without a shape change. Content is the approved, Status:
// Verified KKA-001 record from the Founder Intelligence Knowledge Hub --
// not invented, not paraphrased. This is not a schema addition: no table,
// no migration, no Supabase model.
// -----------------------------------------------------------------------
export interface MockKuralOfTheDay {
  kural_id: string; // e.g. "KKA-001"
  kural_number: number;
  kural_tamil: string;
  core_principle: string; // rendered as "Simple Modern Meaning"
  aram_for_today_title: string;
  aram_for_today_body: string; // rendered as "Today's Practice"
}

export const mockKuralOfTheDay: MockKuralOfTheDay = {
  kural_id: "KKA-001",
  kural_number: 1,
  kural_tamil: "அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு",
  core_principle:
    "Every enduring system begins with a foundation. True understanding starts by recognizing and respecting that foundation.",
  aram_for_today_title: "Honour Your Roots.",
  aram_for_today_body:
    "Every meaningful journey becomes stronger when we understand where we come from. Knowing our roots gives purpose to our future.",
};
