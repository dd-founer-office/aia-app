import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";

/**
 * Content for the evening snacks served to 17 elders at Rainbow Muthiyor
 * Illam (Rainbow Public Welfare Trust, Koneripatti, Rasipuram) on 28 October
 * 2026, shared privately with Vignesh C, who gave it. Written to him
 * ("you"); the copy keeps the programme name out (only the record's Source
 * line names it). Presentation layer only, like lib/voice-trust-content.ts.
 */
export const RAINBOW_ACT_ID = "rainbow-evening-snacks-281026";
export const RAINBOW_PARTNER = "Rainbow Public Welfare Trust";
export const RAINBOW_PLACE = "Koneripatti, Rasipuram, Namakkal";

const IMG = "/mock/rainbow";
// Pin dropped on Rainbow Muthiyor Illam in Google Maps.
const LAT = 11.460451;
const LNG = 78.1973901;

export const RAINBOW_HERO = {
  title: "17 Elders Smiled Over\nEvening Snacks, Because of You",
  description:
    "Because of you, 17 elders at Rainbow Muthiyor Illam shared a warm evening snack and a happy hour together.",
  heroImageUrl: `${IMG}/wide-a.jpg`,
  imageObjectPosition: "40% 50%",
  highlightWord: "Smiled",
};

export const RAINBOW_SNAPSHOT: SnapshotContent = {
  dateLines: ["28 October", "Wednesday"],
  locationLines: ["Koneripatti", "Rasipuram", "Namakkal"],
  keyLine: "17 elders",
  keySub: "evening snacks served",
  partnerLines: ["Rainbow Public", "Welfare Trust"],
  icon: "food",
};

export const RAINBOW_VIDEO: TestimonialContent = {
  videoSrc: `${IMG}/blessing.mp4`,
  posterSrc: `${IMG}/blessing-poster.jpg`,
  subtitle: "Hear from the elders who shared this evening.",
  quote:
    "மாறாத கருணையோடும், பன்மடங்கு செல்வத்தோடும், பல்லாண்டு வாழ ஆசீர்வதிக்கிறோம்",
  speaker: "Elders",
  organization: RAINBOW_PARTNER,
};

const ACT_DESCRIPTION =
  "A warm evening snack, served with care and shared together, because you thought of them.";
export const RAINBOW_ACT: ActContent = {
  heading: "Where Your Kindness Became an Evening Snack",
  moments: [
    {
      title: "Prepared",
      image: `${IMG}/plates.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Served",
      image: `${IMG}/tea.jpg`,
      description: ACT_DESCRIPTION,
      focus: "35% 50%",
    },
    {
      title: "Shared",
      image: `${IMG}/room.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
  ],
};

// Most recent first, inside the 4:30 - 4:50 PM window on 28 October.
const PHOTOS: {
  file: string;
  title: string;
  narrative: string;
  at: [number, number, number];
}[] = [
  {
    file: "room.jpg",
    title: "Everyone Together",
    narrative: "The whole room sharing the evening snack.",
    at: [16, 48, 36],
  },
  {
    file: "tea.jpg",
    title: "Snacks and Tea",
    narrative: "Elders enjoying their snacks with a warm cup of tea.",
    at: [16, 44, 12],
  },
  {
    file: "wide-b.jpg",
    title: "Enjoying the Snack",
    narrative: "Elders seated in rows, eating together.",
    at: [16, 39, 55],
  },
  {
    file: "wide-a.jpg",
    title: "Settling In to Eat",
    narrative: "Elders settling in with their plates.",
    at: [16, 35, 8],
  },
  {
    file: "plates.jpg",
    title: "Evening Snacks Ready",
    narrative: "Plates of evening snacks laid out and ready to serve.",
    at: [16, 31, 20],
  },
];

function format([h, m, sec]: [number, number, number]) {
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  const h12 = h > 12 ? h - 12 : h;
  const period = h >= 12 ? "PM" : "AM";
  return {
    iso: `2026-10-28T${String(h).padStart(2, "0")}:${mm}:${ss}+05:30`,
    short: `${h12}:${mm} ${period}`,
    full: `${h12}:${mm}:${ss} ${period} GMT+5:30`,
  };
}

export const RAINBOW_EVIDENCE: EvidenceTraceItem[] = PHOTOS.map(
  (photo, index) => {
    const t = format(photo.at);
    return {
      id: `rainbow-evidence-${index + 1}`,
      actId: RAINBOW_ACT_ID,
      category: "annadhanam",
      mediaKind: "photo",
      photoUrl: `${IMG}/${photo.file}`,
      momentTitle: photo.title,
      narrative: photo.narrative,
      captureDate: "28 October 2026",
      captureDateIso: t.iso,
      captureTime: t.short,
      captureDateLong: "28 Oct 2026",
      captureTimeWithOffset: t.full,
      capturedBy: "AiA Operations",
      landmark: RAINBOW_PLACE,
      gpsLat: LAT,
      gpsLng: LNG,
      gpsAccuracyMeters: 0,
      approvedBy: "AiA Operations",
      approvedDate: "28 October 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: RAINBOW_PLACE,
        lat: LAT,
        lng: LNG,
      },
    };
  },
);

// Display IDs for the record, in the same pattern as the other pages.
export const RAINBOW_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Monthly Aram",
    recordId: "DD-C-00347",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: RAINBOW_PARTNER,
    recordId: "AL-RPW-00347",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "17 elders evening snacks served",
    recordId: "IM-RPW-00347",
  },
  verification: {
    dataLabel: "Status",
    dataValue: "Completed",
    recordId: "VR-RPW-00347",
  },
};

// Informational only: no button, no WhatsApp.
export const RAINBOW_IMPACT_BANNER = {
  title: "Coming soon: the story behind every step",
  subtitle: "See how and why your contribution was placed here",
};
