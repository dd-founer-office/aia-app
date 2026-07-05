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
// -----------------------------------------------------------------------
// Presentation-only mock data for the Acts of Aram Feed (CA-010) and the
// CA-011 Act of Aram Detail polish pass. Act of Aram is NOT part of the
// locked six-table Sprint 1 schema (see types/index.ts header comment) --
// this exists purely for UI and design validation while that entity
// doesn't exist yet. Geo fields, timeline, verification record, and
// documents are all mock-only, added per explicit direction, not schema
// changes. Documents contain 2 mock entries per act (explicitly approved,
// since the "no placeholder" rule blocks fabricating real business
// records but this is presentation-only UI validation) -- swap for real
// file URLs once documents exist. Sorted newest first per CA-010 Feed
// Ordering Rules (Locked): Publication Date, newest first.
// -----------------------------------------------------------------------
export interface MockAct {
  id: string;
  cause: string;
  place_name: string;
  town: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  impact_summary: string;
  supporting_copy: string;
  completed_date: string;
  completed_date_iso: string;
  hero_image_url: string;
  supporting_image_urls: string[];
  impact_bullets: string[];
  timeline: { label: string; date: string }[];
  verification: {
    captured_by: string;
    verified_by: string;
    timestamp: string;
    gps_verified: boolean;
    partner_organisation: string;
  };
  documents: { label: string; url: string }[];
  beneficiary_count: number;
  story_situation: string;
  story_action: string;
  story_outcome: string;
  reflection: string;
  is_shared_act?: boolean;
  contributor_count?: number;
}

export const mockActs: MockAct[] = [
  {
    id: "act_1",
    cause: "Education",
    place_name: "Keelavasal, Madurai",
    town: "Keelavasal",
    district: "Madurai",
    state: "Tamil Nadu",
    latitude: 9.9252,
    longitude: 78.1198,
    impact_summary: "24 Students Received School Kits",
    supporting_copy: "Every child deserves the tools to learn.",
    completed_date: "28 June 2026",
    completed_date_iso: "2026-06-28",
    hero_image_url:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80",
    supporting_image_urls: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80",
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=300&q=80",
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&q=80",
    ],
    impact_bullets: [
      "24 children received school kits.",
      "1 government school supported.",
      "5 volunteers participated.",
    ],
    timeline: [
      { label: "Initiative Planned", date: "10 June 2026" },
      { label: "Materials Prepared", date: "18 June 2026" },
      { label: "Executed On-site", date: "26 June 2026" },
      { label: "Evidence Captured", date: "26 June 2026" },
      { label: "Verified", date: "27 June 2026" },
      { label: "Published", date: "28 June 2026" },
    ],
    verification: {
      captured_by: "Field Partner Team",
      verified_by: "AiA Verification Desk",
      timestamp: "28 June 2026, 10:42 AM",
      gps_verified: true,
      partner_organisation: "Vidhai Foundation",
    },
    documents: [
      { label: "Tax Invoice (PDF)", url: "#" },
      { label: "Payment Receipt (PDF)", url: "#" },
    ],
    beneficiary_count: 24,
    story_situation:
      "Many children in Keelavasal were attending school without basic supplies.",
    story_action:
      "AiA partnered with a local school to distribute complete school kits.",
    story_outcome:
      "24 students now have the materials they need for the school year.",
    reflection: "A small kit can be the difference between falling behind and keeping pace.",
  },
  {
    id: "act_2",
    cause: "Environment",
    place_name: "Bhavani, Erode",
    town: "Bhavani",
    district: "Erode",
    state: "Tamil Nadu",
    latitude: 11.4467,
    longitude: 77.6839,
    impact_summary: "150 Native Trees Were Planted",
    supporting_copy: "Every tree planted today shapes tomorrow's air.",
    completed_date: "21 June 2026",
    completed_date_iso: "2026-06-21",
    hero_image_url:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=80",
    supporting_image_urls: [
      "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=300&q=80",
      "https://images.unsplash.com/photo-1466692476868-9ee5a3a3e93b?w=300&q=80",
    ],
    impact_bullets: [
      "150 native trees were planted.",
      "1 hillside restoration site supported.",
      "43 contributors participated together.",
    ],
    timeline: [
      { label: "Initiative Planned", date: "2 June 2026" },
      { label: "Materials Prepared", date: "10 June 2026" },
      { label: "Executed On-site", date: "19 June 2026" },
      { label: "Evidence Captured", date: "19 June 2026" },
      { label: "Verified", date: "20 June 2026" },
      { label: "Published", date: "21 June 2026" },
    ],
    verification: {
      captured_by: "Field Partner Team",
      verified_by: "AiA Verification Desk",
      timestamp: "21 June 2026, 9:15 AM",
      gps_verified: true,
      partner_organisation: "Pachai Trust",
    },
    documents: [
      { label: "Tax Invoice (PDF)", url: "#" },
      { label: "Payment Receipt (PDF)", url: "#" },
    ],
    beneficiary_count: 120,
    story_situation: "The hillside near Bhavani had lost much of its native tree cover.",
    story_action:
      "43 contributors came together to fund and plant native saplings with a local partner.",
    story_outcome:
      "150 native trees now stand, restoring shade and habitat for the community.",
    reflection: "Continuity isn't just personal -- forests need it too.",
    is_shared_act: true,
    contributor_count: 43,
  },
  {
    id: "act_3",
    cause: "Annadhanam",
    place_name: "Kumbakonam, Thanjavur",
    town: "Kumbakonam",
    district: "Thanjavur",
    state: "Tamil Nadu",
    latitude: 10.9601,
    longitude: 79.3788,
    impact_summary: "200 Meals Were Served",
    supporting_copy: "A shared meal is Aram in its simplest form.",
    completed_date: "14 June 2026",
    completed_date_iso: "2026-06-14",
    hero_image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80",
    supporting_image_urls: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80",
      "https://images.unsplash.com/photo-1591189824332-83f2e5cca2e0?w=300&q=80",
    ],
    impact_bullets: [
      "200 meals were served.",
      "1 temple community supported.",
      "8 volunteers participated.",
    ],
    timeline: [
      { label: "Initiative Planned", date: "28 May 2026" },
      { label: "Materials Prepared", date: "6 June 2026" },
      { label: "Executed On-site", date: "13 June 2026" },
      { label: "Evidence Captured", date: "13 June 2026" },
      { label: "Verified", date: "14 June 2026" },
      { label: "Published", date: "14 June 2026" },
    ],
    verification: {
      captured_by: "Field Partner Team",
      verified_by: "AiA Verification Desk",
      timestamp: "14 June 2026, 6:30 PM",
      gps_verified: true,
      partner_organisation: "Annam Trust",
    },
    documents: [
      { label: "Tax Invoice (PDF)", url: "#" },
      { label: "Payment Receipt (PDF)", url: "#" },
    ],
    beneficiary_count: 200,
    story_situation: "Families near the Kumbakonam temple often go without a warm meal.",
    story_action: "AiA's partner organized and served a community meal for a full day.",
    story_outcome: "200 meals were served, offering nourishment and dignity.",
    reflection: "Aram is often this simple: making sure no one goes hungry today.",
  },
];

// Feed Ordering Rules (Locked, CA-010): Primary sort = Publication Date,
// newest first. Never reordered by views, engagement, participation
// volume, contributor count, or cause popularity.
export function getActsFeed(): MockAct[] {
  return [...mockActs].sort(
    (a, b) =>
      new Date(b.completed_date_iso).getTime() - new Date(a.completed_date_iso).getTime()
  );
}

export function getActById(id: string): MockAct | undefined {
  return mockActs.find((act) => act.id === id);
}
