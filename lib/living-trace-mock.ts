import { SAMPLE_VIDEO_URL } from "@/lib/act-media";
import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";

// -----------------------------------------------------------------------
// Mock data only — Living Trace Viewer, Sprint 1A (frontend only, no
// Supabase). Not part of the locked six-table Sprint 1 schema. Each
// act's evidence is returned newest-first per Living Trace Constitution
// §7 (Chronological Story). Every act carries 5-6 items mixing photo and
// video evidence, per explicit direction, so the card stack always shows
// a full center+2-either-side rotation. SAMPLE_VIDEO_URL is reused from
// lib/act-media.ts (same test-only placeholder already approved there).
// -----------------------------------------------------------------------

const trust_act1 = {
  kind: "info" as const,
  verificationStatus: "verified" as const,
  locationLabel: "Government Higher Secondary School, Keelavasal",
  infoLabel: "School",
  infoValue: "Government Higher Secondary School, Keelavasal, Madurai",
};

const trust_act2 = {
  kind: "map" as const,
  verificationStatus: "verified" as const,
  locationLabel: "Bhavani, Erode",
  lat: 11.4467,
  lng: 77.6839,
};

const trust_act3 = {
  kind: "map" as const,
  verificationStatus: "verified" as const,
  locationLabel: "Kumbakonam, Thanjavur",
  lat: 10.9601,
  lng: 79.3788,
};

const trust_act4 = {
  kind: "map" as const,
  verificationStatus: "verified" as const,
  locationLabel: "Srirangam, Tiruchirappalli",
  lat: 10.8624,
  lng: 78.6928,
};

const trust_act5 = {
  kind: "info" as const,
  verificationStatus: "verified" as const,
  locationLabel: "Sivakasi, Virudhunagar",
  infoLabel: "Support Partner",
  infoValue: "Nalam Health Trust, Sivakasi",
};

const trace: Record<string, EvidenceTraceItem[]> = {
  // act_1 — Student / Education (Keelavasal school kits), 28 Jun 2026.
  // Padded with extra execution angles + one video, per explicit
  // direction, even though only execution evidence exists (too recent
  // for a living update).
  act_1: [
    { id: "ev_act1_6", actId: "act_1", category: "student", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "28 June 2026", captureDateIso: "2026-06-28T11:10:00", captureTime: "11:10 AM", capturedBy: "Field Partner Team", gpsLat: 9.9252, gpsLng: 78.1198, gpsAccuracyMeters: 6, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "28 June 2026", trust: trust_act1 },
    { id: "ev_act1_5", actId: "act_1", category: "student", mediaKind: "video", photoUrl: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=900&q=80", videoUrl: SAMPLE_VIDEO_URL, durationLabel: "0:14", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "28 June 2026", captureDateIso: "2026-06-28T10:55:00", captureTime: "10:55 AM", capturedBy: "Field Partner Team", gpsLat: 9.9252, gpsLng: 78.1198, gpsAccuracyMeters: 7, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "28 June 2026", trust: trust_act1 },
    { id: "ev_act1_4", actId: "act_1", category: "student", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "28 June 2026", captureDateIso: "2026-06-28T10:42:00", captureTime: "10:42 AM", capturedBy: "Field Partner Team", gpsLat: 9.9252, gpsLng: 78.1198, gpsAccuracyMeters: 7, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "28 June 2026", trust: trust_act1 },
    { id: "ev_act1_3", actId: "act_1", category: "student", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "28 June 2026", captureDateIso: "2026-06-28T10:30:00", captureTime: "10:30 AM", capturedBy: "Field Partner Team", gpsLat: 9.9252, gpsLng: 78.1198, gpsAccuracyMeters: 8, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "28 June 2026", trust: trust_act1 },
    { id: "ev_act1_2", actId: "act_1", category: "student", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "28 June 2026", captureDateIso: "2026-06-28T10:15:00", captureTime: "10:15 AM", capturedBy: "Field Partner Team", gpsLat: 9.9252, gpsLng: 78.1198, gpsAccuracyMeters: 6, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "28 June 2026", trust: trust_act1 },
    { id: "ev_act1_1", actId: "act_1", category: "student", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "28 June 2026", captureDateIso: "2026-06-28T10:05:00", captureTime: "10:05 AM", capturedBy: "Field Partner Team", gpsLat: 9.9252, gpsLng: 78.1198, gpsAccuracyMeters: 9, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "28 June 2026", trust: trust_act1 },
  ],

  // act_2 — Tree / Environment (Bhavani hillside planting), 21 Jun 2026.
  act_2: [
    { id: "ev_act2_6", actId: "act_2", category: "tree", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "21 June 2026", captureDateIso: "2026-06-21T10:20:00", captureTime: "10:20 AM", capturedBy: "Field Partner Team", gpsLat: 11.4467, gpsLng: 77.6839, gpsAccuracyMeters: 5, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "21 June 2026", trust: trust_act2 },
    { id: "ev_act2_5", actId: "act_2", category: "tree", mediaKind: "video", photoUrl: "https://images.unsplash.com/photo-1466692476868-9ee5a3a3e93b?w=900&q=80", videoUrl: SAMPLE_VIDEO_URL, durationLabel: "0:18", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "21 June 2026", captureDateIso: "2026-06-21T10:05:00", captureTime: "10:05 AM", capturedBy: "Field Partner Team", gpsLat: 11.4467, gpsLng: 77.6839, gpsAccuracyMeters: 6, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "21 June 2026", trust: trust_act2 },
    { id: "ev_act2_4", actId: "act_2", category: "tree", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "21 June 2026", captureDateIso: "2026-06-21T09:40:00", captureTime: "9:40 AM", capturedBy: "Field Partner Team", gpsLat: 11.4467, gpsLng: 77.6839, gpsAccuracyMeters: 5, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "21 June 2026", trust: trust_act2 },
    { id: "ev_act2_3", actId: "act_2", category: "tree", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "21 June 2026", captureDateIso: "2026-06-21T09:25:00", captureTime: "9:25 AM", capturedBy: "Field Partner Team", gpsLat: 11.4467, gpsLng: 77.6839, gpsAccuracyMeters: 7, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "21 June 2026", trust: trust_act2 },
    { id: "ev_act2_2", actId: "act_2", category: "tree", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1466692476868-9ee5a3a3e93b?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "21 June 2026", captureDateIso: "2026-06-21T09:15:00", captureTime: "9:15 AM", capturedBy: "Field Partner Team", gpsLat: 11.4467, gpsLng: 77.6839, gpsAccuracyMeters: 6, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "21 June 2026", trust: trust_act2 },
    { id: "ev_act2_1", actId: "act_2", category: "tree", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "21 June 2026", captureDateIso: "2026-06-21T09:00:00", captureTime: "9:00 AM", capturedBy: "Field Partner Team", gpsLat: 11.4467, gpsLng: 77.6839, gpsAccuracyMeters: 8, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "21 June 2026", trust: trust_act2 },
  ],

  // act_3 — Annadhanam (Kumbakonam community meal), 14 Jun 2026.
  act_3: [
    { id: "ev_act3_6", actId: "act_3", category: "annadhanam", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "14 June 2026", captureDateIso: "2026-06-14T19:10:00", captureTime: "7:10 PM", capturedBy: "Field Partner Team", gpsLat: 10.9601, gpsLng: 79.3788, gpsAccuracyMeters: 7, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "14 June 2026", trust: trust_act3 },
    { id: "ev_act3_5", actId: "act_3", category: "annadhanam", mediaKind: "video", photoUrl: "https://images.unsplash.com/photo-1591189824332-83f2e5cca2e0?w=900&q=80", videoUrl: SAMPLE_VIDEO_URL, durationLabel: "0:16", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "14 June 2026", captureDateIso: "2026-06-14T18:55:00", captureTime: "6:55 PM", capturedBy: "Field Partner Team", gpsLat: 10.9601, gpsLng: 79.3788, gpsAccuracyMeters: 8, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "14 June 2026", trust: trust_act3 },
    { id: "ev_act3_4", actId: "act_3", category: "annadhanam", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "14 June 2026", captureDateIso: "2026-06-14T18:45:00", captureTime: "6:45 PM", capturedBy: "Field Partner Team", gpsLat: 10.9601, gpsLng: 79.3788, gpsAccuracyMeters: 8, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "14 June 2026", trust: trust_act3 },
    { id: "ev_act3_3", actId: "act_3", category: "annadhanam", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "14 June 2026", captureDateIso: "2026-06-14T18:38:00", captureTime: "6:38 PM", capturedBy: "Field Partner Team", gpsLat: 10.9601, gpsLng: 79.3788, gpsAccuracyMeters: 6, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "14 June 2026", trust: trust_act3 },
    { id: "ev_act3_2", actId: "act_3", category: "annadhanam", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1591189824332-83f2e5cca2e0?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "14 June 2026", captureDateIso: "2026-06-14T18:30:00", captureTime: "6:30 PM", capturedBy: "Field Partner Team", gpsLat: 10.9601, gpsLng: 79.3788, gpsAccuracyMeters: 7, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "14 June 2026", trust: trust_act3 },
    { id: "ev_act3_1", actId: "act_3", category: "annadhanam", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "14 June 2026", captureDateIso: "2026-06-14T18:15:00", captureTime: "6:15 PM", capturedBy: "Field Partner Team", gpsLat: 10.9601, gpsLng: 79.3788, gpsAccuracyMeters: 9, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "14 June 2026", trust: trust_act3 },
  ],

  // act_4 — Temple Ritual (Srirangam). Full Living Trace: execution day
  // (padded with an extra angle + video) → 6-month update → 1-year update.
  act_4: [
    { id: "ev_act4_6", actId: "act_4", category: "temple", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1621996659490-3403f484ca6a?w=900&q=80", proofType: "living_update", proofTypeLabel: "Living Update — 1 Year Later", captureDate: "12 July 2026", captureDateIso: "2026-07-12T07:30:00", captureTime: "7:30 AM", capturedBy: "Kovil Paniyam Trust", gpsLat: 10.8624, gpsLng: 78.6928, gpsAccuracyMeters: 9, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "13 July 2026", trust: trust_act4 },
    { id: "ev_act4_5", actId: "act_4", category: "temple", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1609948543911-e4e1f0c3b8f2?w=900&q=80", proofType: "living_update", proofTypeLabel: "Living Update — 6 Months Later", captureDate: "15 January 2026", captureDateIso: "2026-01-15T08:00:00", captureTime: "8:00 AM", capturedBy: "Kovil Paniyam Trust", gpsLat: 10.8624, gpsLng: 78.6928, gpsAccuracyMeters: 8, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "16 January 2026", trust: trust_act4 },
    { id: "ev_act4_4", actId: "act_4", category: "temple", mediaKind: "video", photoUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=80", videoUrl: SAMPLE_VIDEO_URL, durationLabel: "0:20", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "15 July 2025", captureDateIso: "2025-07-15T08:15:00", captureTime: "8:15 AM", capturedBy: "Field Partner Team", gpsLat: 10.8624, gpsLng: 78.6928, gpsAccuracyMeters: 7, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "15 July 2025", trust: trust_act4 },
    { id: "ev_act4_3", actId: "act_4", category: "temple", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1621996659490-3403f484ca6a?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "15 July 2025", captureDateIso: "2025-07-15T07:45:00", captureTime: "7:45 AM", capturedBy: "Field Partner Team", gpsLat: 10.8624, gpsLng: 78.6928, gpsAccuracyMeters: 6, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "15 July 2025", trust: trust_act4 },
    { id: "ev_act4_2", actId: "act_4", category: "temple", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1609948543911-e4e1f0c3b8f2?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "15 July 2025", captureDateIso: "2025-07-15T07:20:00", captureTime: "7:20 AM", capturedBy: "Field Partner Team", gpsLat: 10.8624, gpsLng: 78.6928, gpsAccuracyMeters: 8, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "15 July 2025", trust: trust_act4 },
    { id: "ev_act4_1", actId: "act_4", category: "temple", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "15 July 2025", captureDateIso: "2025-07-15T07:00:00", captureTime: "7:00 AM", capturedBy: "Field Partner Team", gpsLat: 10.8624, gpsLng: 78.6928, gpsAccuracyMeters: 6, device: "Partner Field App — Android", approvedBy: "AiA Verification Desk", approvedDate: "15 July 2025", trust: trust_act4 },
  ],

  // act_5 — Family Support / Medical (Sivakasi). Execution day (padded)
  // → 6-month living update (padded with a video).
  act_5: [
    { id: "ev_act5_6", actId: "act_5", category: "family", mediaKind: "video", photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80", videoUrl: SAMPLE_VIDEO_URL, durationLabel: "0:15", proofType: "living_update", proofTypeLabel: "Living Update — 6 Months Later", captureDate: "10 May 2026", captureDateIso: "2026-05-10T16:15:00", captureTime: "4:15 PM", capturedBy: "Nalam Health Trust", gpsLat: 9.4517, gpsLng: 77.7987, gpsAccuracyMeters: 10, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "11 May 2026", trust: trust_act5 },
    { id: "ev_act5_5", actId: "act_5", category: "family", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80", proofType: "living_update", proofTypeLabel: "Living Update — 6 Months Later", captureDate: "10 May 2026", captureDateIso: "2026-05-10T16:00:00", captureTime: "4:00 PM", capturedBy: "Nalam Health Trust", gpsLat: 9.4517, gpsLng: 77.7987, gpsAccuracyMeters: 9, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "11 May 2026", trust: trust_act5 },
    { id: "ev_act5_4", actId: "act_5", category: "family", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "10 November 2025", captureDateIso: "2025-11-10T14:45:00", captureTime: "2:45 PM", capturedBy: "Field Partner Team", gpsLat: 9.4517, gpsLng: 77.7987, gpsAccuracyMeters: 8, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "10 November 2025", trust: trust_act5 },
    { id: "ev_act5_3", actId: "act_5", category: "family", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "10 November 2025", captureDateIso: "2025-11-10T14:30:00", captureTime: "2:30 PM", capturedBy: "Field Partner Team", gpsLat: 9.4517, gpsLng: 77.7987, gpsAccuracyMeters: 9, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "10 November 2025", trust: trust_act5 },
    { id: "ev_act5_2", actId: "act_5", category: "family", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "10 November 2025", captureDateIso: "2025-11-10T14:15:00", captureTime: "2:15 PM", capturedBy: "Field Partner Team", gpsLat: 9.4517, gpsLng: 77.7987, gpsAccuracyMeters: 9, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "10 November 2025", trust: trust_act5 },
    { id: "ev_act5_1", actId: "act_5", category: "family", mediaKind: "photo", photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80", proofType: "execution", proofTypeLabel: "Execution Evidence", captureDate: "10 November 2025", captureDateIso: "2025-11-10T14:00:00", captureTime: "2:00 PM", capturedBy: "Field Partner Team", gpsLat: 9.4517, gpsLng: 77.7987, gpsAccuracyMeters: 10, device: "Partner Field App — iOS", approvedBy: "AiA Verification Desk", approvedDate: "10 November 2025", trust: trust_act5 },
  ],
};

// Chronological Story (Locked, Living Trace Constitution §7): newest
// first. Source arrays above are already authored newest-first.
export function getEvidenceTrace(actId: string): EvidenceTraceItem[] {
  return trace[actId] ?? [];
}
