import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";

/**
 * Narrow, id-scoped FRONTEND-ONLY content override for one real, already-
 * published Act -- every value below is presentation layer only, nothing
 * here is written to or read from Supabase. PublishedActDetail.tsx swaps
 * these in ahead of the real fetched title/description/heroImageUrl/
 * evidence for this one id; every other Act keeps using its real DB data
 * untouched. ActSnapshot.tsx / ActTheAct.tsx branch on the same id for
 * their own (already-hardcoded) content.
 *
 * Points at the real "Annadhanam For Homeless people" mission (Thanjavur
 * Seva Trust) because that's the one real, published Annadhanam mission
 * this account is already linked to and can open live -- not because its
 * stored title/photos have anything to do with the story below.
 */
export const ANNADHANAM_ELDERS_ACT_ID = "aeab2bfe-8619-4b11-8f2b-7ad16c301d42";

export const ANNADHANAM_ELDERS_HERO = {
  title: "Some Meals Are Served to Feed.\nSome Are Served to Remind Us We Care.",
  description:
    "Because sometimes, the most meaningful thing we can give someone is the feeling that they are remembered.",
  heroImageUrl: "/mock/annadhanam-shared.jpg",
  organization: "Annai Aravindhar Karunai Illam",
};

// Mirrors the shape AND ordering getPublishedActTrace() returns (most
// recent capture first) -- ActEvidence's photo row takes the first three
// of whatever order it's given, and separately re-sorts to find the
// earliest item for its own WHEN/WHERE/WHO record, so this order is what
// decides which three photos the row shows.
export const ANNADHANAM_ELDERS_EVIDENCE: EvidenceTraceItem[] = [
  {
    id: "annadhanam-elders-evidence-5",
    actId: ANNADHANAM_ELDERS_ACT_ID,
    category: "annadhanam",
    mediaKind: "photo",
    photoUrl: "/mock/annadhanam-shared.jpg",
    momentTitle: "Elders Shared the Meal Together",
    narrative: "Elders gathered to eat together.",
    captureDate: "28 September 2026",
    captureDateIso: "2026-09-28T08:45:00+05:30",
    captureTime: "8:45 AM",
    captureDateLong: "28 Sep 2026",
    captureTimeWithOffset: "8:45:00 AM GMT+5:30",
    capturedBy: "AiA Operations",
    landmark: "Sreenivasanallur, Kumbakonam, Thanjavur",
    gpsLat: 10.9581,
    gpsLng: 79.3789,
    gpsAccuracyMeters: 7,
    approvedBy: "Suresh",
    approvedDate: "3 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: "Sreenivasanallur, Kumbakonam, Thanjavur",
      lat: 10.9581,
      lng: 79.3789,
    },
  },
  {
    id: "annadhanam-elders-evidence-4",
    actId: ANNADHANAM_ELDERS_ACT_ID,
    category: "annadhanam",
    mediaKind: "photo",
    photoUrl: "/mock/annadhanam-served-man.jpg",
    momentTitle: "A Meal Was Served",
    narrative: "An elder received his meal.",
    captureDate: "28 September 2026",
    captureDateIso: "2026-09-28T08:30:00+05:30",
    captureTime: "8:30 AM",
    captureDateLong: "28 Sep 2026",
    captureTimeWithOffset: "8:30:00 AM GMT+5:30",
    capturedBy: "AiA Operations",
    landmark: "Sreenivasanallur, Kumbakonam, Thanjavur",
    gpsLat: 10.9581,
    gpsLng: 79.3789,
    gpsAccuracyMeters: 7,
    approvedBy: "Suresh",
    approvedDate: "3 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: "Sreenivasanallur, Kumbakonam, Thanjavur",
      lat: 10.9581,
      lng: 79.3789,
    },
  },
  {
    id: "annadhanam-elders-evidence-3",
    actId: ANNADHANAM_ELDERS_ACT_ID,
    category: "annadhanam",
    mediaKind: "photo",
    photoUrl: "/mock/annadhanam-served-woman.jpg",
    momentTitle: "A Meal Was Served",
    narrative: "An elder received her meal.",
    captureDate: "28 September 2026",
    captureDateIso: "2026-09-28T08:25:00+05:30",
    captureTime: "8:25 AM",
    captureDateLong: "28 Sep 2026",
    captureTimeWithOffset: "8:25:00 AM GMT+5:30",
    capturedBy: "AiA Operations",
    landmark: "Sreenivasanallur, Kumbakonam, Thanjavur",
    gpsLat: 10.9581,
    gpsLng: 79.3789,
    gpsAccuracyMeters: 7,
    approvedBy: "Suresh",
    approvedDate: "3 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: "Sreenivasanallur, Kumbakonam, Thanjavur",
      lat: 10.9581,
      lng: 79.3789,
    },
  },
  {
    id: "annadhanam-elders-evidence-2",
    actId: ANNADHANAM_ELDERS_ACT_ID,
    category: "annadhanam",
    mediaKind: "photo",
    photoUrl: "/mock/annadhanam-plates.jpg",
    momentTitle: "Meals Were Plated",
    narrative: "Meals were plated for serving.",
    captureDate: "28 September 2026",
    captureDateIso: "2026-09-28T08:00:00+05:30",
    captureTime: "8:00 AM",
    captureDateLong: "28 Sep 2026",
    captureTimeWithOffset: "8:00:00 AM GMT+5:30",
    capturedBy: "AiA Operations",
    landmark: "Sreenivasanallur, Kumbakonam, Thanjavur",
    gpsLat: 10.9581,
    gpsLng: 79.3789,
    gpsAccuracyMeters: 7,
    approvedBy: "Suresh",
    approvedDate: "3 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: "Sreenivasanallur, Kumbakonam, Thanjavur",
      lat: 10.9581,
      lng: 79.3789,
    },
  },
  {
    id: "annadhanam-elders-evidence-1",
    actId: ANNADHANAM_ELDERS_ACT_ID,
    category: "annadhanam",
    mediaKind: "photo",
    photoUrl: "/mock/annadhanam-prepared.jpg",
    momentTitle: "The Meal Was Prepared",
    narrative: "The Annadhanam meal was prepared.",
    captureDate: "28 September 2026",
    captureDateIso: "2026-09-28T07:30:00+05:30",
    captureTime: "7:30 AM",
    captureDateLong: "28 Sep 2026",
    captureTimeWithOffset: "7:30:00 AM GMT+5:30",
    capturedBy: "AiA Operations",
    landmark: "Sreenivasanallur, Kumbakonam, Thanjavur",
    gpsLat: 10.9581,
    gpsLng: 79.3789,
    gpsAccuracyMeters: 7,
    approvedBy: "Suresh",
    approvedDate: "3 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: "Sreenivasanallur, Kumbakonam, Thanjavur",
      lat: 10.9581,
      lng: 79.3789,
    },
  },
];
