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
