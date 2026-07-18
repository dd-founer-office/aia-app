import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";

// -----------------------------------------------------------------------
// Mock data only — Living Trace Viewer, Sprint 1A (frontend only, no
// Supabase). Not part of the locked six-table Sprint 1 schema. Each
// act's evidence is returned newest-first per Living Trace Constitution
// §7 (Chronological Story): users travel backwards through time, with
// execution photos naturally transitioning into long-term Living
// Impact updates as they page further back.
// -----------------------------------------------------------------------

const trace: Record<string, EvidenceTraceItem[]> = {
  // act_1 — Student / Education (Keelavasal school kits). Completed
  // 28 Jun 2026, only 3 weeks before "today" — execution evidence only,
  // no living update has had time to accumulate yet.
  act_1: [
    {
      id: "ev_act1_2",
      actId: "act_1",
      category: "student",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&q=80",
      captureDate: "28 June 2026",
      captureDateIso: "2026-06-28T10:42:00",
      captureTime: "10:42 AM",
      capturedBy: "Field Partner Team",
      gpsLat: 9.9252,
      gpsLng: 78.1198,
      gpsAccuracyMeters: 7,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "28 June 2026",
      trust: {
        kind: "info",
        verificationStatus: "verified",
        locationLabel: "Government Higher Secondary School, Keelavasal",
        infoLabel: "School",
        infoValue: "Government Higher Secondary School, Keelavasal, Madurai",
      },
    },
    {
      id: "ev_act1_1",
      actId: "act_1",
      category: "student",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80",
      captureDate: "28 June 2026",
      captureDateIso: "2026-06-28T10:15:00",
      captureTime: "10:15 AM",
      capturedBy: "Field Partner Team",
      gpsLat: 9.9252,
      gpsLng: 78.1198,
      gpsAccuracyMeters: 6,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "28 June 2026",
      trust: {
        kind: "info",
        verificationStatus: "verified",
        locationLabel: "Government Higher Secondary School, Keelavasal",
        infoLabel: "School",
        infoValue: "Government Higher Secondary School, Keelavasal, Madurai",
      },
    },
  ],

  // act_2 — Tree / Environment (Bhavani hillside planting). Completed
  // 21 Jun 2026 — execution evidence only.
  act_2: [
    {
      id: "ev_act2_2",
      actId: "act_2",
      category: "tree",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1466692476868-9ee5a3a3e93b?w=900&q=80",
      captureDate: "21 June 2026",
      captureDateIso: "2026-06-21T09:40:00",
      captureTime: "9:40 AM",
      capturedBy: "Field Partner Team",
      gpsLat: 11.4467,
      gpsLng: 77.6839,
      gpsAccuracyMeters: 5,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "21 June 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Bhavani, Erode",
        lat: 11.4467,
        lng: 77.6839,
      },
    },
    {
      id: "ev_act2_1",
      actId: "act_2",
      category: "tree",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=80",
      captureDate: "21 June 2026",
      captureDateIso: "2026-06-21T09:15:00",
      captureTime: "9:15 AM",
      capturedBy: "Field Partner Team",
      gpsLat: 11.4467,
      gpsLng: 77.6839,
      gpsAccuracyMeters: 6,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "21 June 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Bhavani, Erode",
        lat: 11.4467,
        lng: 77.6839,
      },
    },
  ],

  // act_3 — Annadhanam (Kumbakonam community meal). Completed
  // 14 Jun 2026 — execution evidence only.
  act_3: [
    {
      id: "ev_act3_2",
      actId: "act_3",
      category: "annadhanam",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1591189824332-83f2e5cca2e0?w=900&q=80",
      captureDate: "14 June 2026",
      captureDateIso: "2026-06-14T18:45:00",
      captureTime: "6:45 PM",
      capturedBy: "Field Partner Team",
      gpsLat: 10.9601,
      gpsLng: 79.3788,
      gpsAccuracyMeters: 8,
      device: "Partner Field App — iOS",
      approvedBy: "AiA Verification Desk",
      approvedDate: "14 June 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Kumbakonam, Thanjavur",
        lat: 10.9601,
        lng: 79.3788,
      },
    },
    {
      id: "ev_act3_1",
      actId: "act_3",
      category: "annadhanam",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80",
      captureDate: "14 June 2026",
      captureDateIso: "2026-06-14T18:30:00",
      captureTime: "6:30 PM",
      capturedBy: "Field Partner Team",
      gpsLat: 10.9601,
      gpsLng: 79.3788,
      gpsAccuracyMeters: 7,
      device: "Partner Field App — iOS",
      approvedBy: "AiA Verification Desk",
      approvedDate: "14 June 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Kumbakonam, Thanjavur",
        lat: 10.9601,
        lng: 79.3788,
      },
    },
  ],

  // act_4 — Temple Ritual (Srirangam Kumbabhishekam). Completed over a
  // year ago — full Living Trace demonstrated: execution → 6-month
  // living update → 1-year living update.
  act_4: [
    {
      id: "ev_act4_3",
      actId: "act_4",
      category: "temple",
      proofType: "living_update",
      proofTypeLabel: "Living Update — 1 Year Later",
      photoUrl:
        "https://images.unsplash.com/photo-1621996659490-3403f484ca6a?w=900&q=80",
      captureDate: "12 July 2026",
      captureDateIso: "2026-07-12T07:30:00",
      captureTime: "7:30 AM",
      capturedBy: "Kovil Paniyam Trust",
      gpsLat: 10.8624,
      gpsLng: 78.6928,
      gpsAccuracyMeters: 9,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "13 July 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Srirangam, Tiruchirappalli",
        lat: 10.8624,
        lng: 78.6928,
      },
    },
    {
      id: "ev_act4_2",
      actId: "act_4",
      category: "temple",
      proofType: "living_update",
      proofTypeLabel: "Living Update — 6 Months Later",
      photoUrl:
        "https://images.unsplash.com/photo-1609948543911-e4e1f0c3b8f2?w=900&q=80",
      captureDate: "15 January 2026",
      captureDateIso: "2026-01-15T08:00:00",
      captureTime: "8:00 AM",
      capturedBy: "Kovil Paniyam Trust",
      gpsLat: 10.8624,
      gpsLng: 78.6928,
      gpsAccuracyMeters: 8,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "16 January 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Srirangam, Tiruchirappalli",
        lat: 10.8624,
        lng: 78.6928,
      },
    },
    {
      id: "ev_act4_1",
      actId: "act_4",
      category: "temple",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=80",
      captureDate: "15 July 2025",
      captureDateIso: "2025-07-15T07:00:00",
      captureTime: "7:00 AM",
      capturedBy: "Field Partner Team",
      gpsLat: 10.8624,
      gpsLng: 78.6928,
      gpsAccuracyMeters: 6,
      device: "Partner Field App — Android",
      approvedBy: "AiA Verification Desk",
      approvedDate: "15 July 2025",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: "Srirangam, Tiruchirappalli",
        lat: 10.8624,
        lng: 78.6928,
      },
    },
  ],

  // act_5 — Family Support / Medical (Sivakasi). Completed ~8 months
  // ago — execution + one living update. Trust Card uses "info" kind,
  // not a home-address map (dignity/privacy, extending the Student
  // rule — see note above).
  act_5: [
    {
      id: "ev_act5_2",
      actId: "act_5",
      category: "family",
      proofType: "living_update",
      proofTypeLabel: "Living Update — 6 Months Later",
      photoUrl:
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80",
      captureDate: "10 May 2026",
      captureDateIso: "2026-05-10T16:00:00",
      captureTime: "4:00 PM",
      capturedBy: "Nalam Health Trust",
      gpsLat: 9.4517,
      gpsLng: 77.7987,
      gpsAccuracyMeters: 10,
      device: "Partner Field App — iOS",
      approvedBy: "AiA Verification Desk",
      approvedDate: "11 May 2026",
      trust: {
        kind: "info",
        verificationStatus: "verified",
        locationLabel: "Sivakasi, Virudhunagar",
        infoLabel: "Support Partner",
        infoValue: "Nalam Health Trust, Sivakasi",
      },
    },
    {
      id: "ev_act5_1",
      actId: "act_5",
      category: "family",
      proofType: "execution",
      proofTypeLabel: "Execution Evidence",
      photoUrl:
        "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900&q=80",
      captureDate: "10 November 2025",
      captureDateIso: "2025-11-10T14:15:00",
      captureTime: "2:15 PM",
      capturedBy: "Field Partner Team",
      gpsLat: 9.4517,
      gpsLng: 77.7987,
      gpsAccuracyMeters: 9,
      device: "Partner Field App — iOS",
      approvedBy: "AiA Verification Desk",
      approvedDate: "10 November 2025",
      trust: {
        kind: "info",
        verificationStatus: "verified",
        locationLabel: "Sivakasi, Virudhunagar",
        infoLabel: "Support Partner",
        infoValue: "Nalam Health Trust, Sivakasi",
      },
    },
  ],
};

// Chronological Story (Locked, Living Trace Constitution §7): newest
// first. Source arrays above are already authored newest-first.
export function getEvidenceTrace(actId: string): EvidenceTraceItem[] {
  return trace[actId] ?? [];
}
