import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";

/**
 * Content for the lunch served to 20 elders at Rainbow Muthiyor Illam
 * (Rainbow Public Welfare Trust, Koneripatti, Rasipuram) on 12 November 2026,
 * shared privately with Vetrivendhan and Keerthanya, children of Vinothkumar,
 * who gave it. Written to them ("you"); the copy keeps the programme name out
 * (only the record's Source line names it). Presentation layer only, like
 * lib/rainbow-breakfast-content.ts.
 */
export const RAINBOW_LUNCH_ACT_ID = "rainbow-lunch-121126";
export const RAINBOW_LUNCH_PARTNER = "Rainbow Public Welfare Trust";
export const RAINBOW_LUNCH_PLACE = "Koneripatti, Rasipuram, Namakkal";

const IMG = "/mock/rainbow-lunch";
// Same pin as the other Rainbow Muthiyor Illam pages.
const LAT = 11.460451;
const LNG = 78.1973901;

export const RAINBOW_LUNCH_HERO = {
  title: "Small Hands.\nA Table Full of Blessings",
  description:
    "Vetrivendhan and Keerthanya, you filled a long table with rice, sambar and sweet bananas, and a room of elders began their lunch with a prayer for you.",
  heroImageUrl: `${IMG}/p33.jpg`,
  imageObjectPosition: "30% 88%",
  highlightWord: "Blessings",
};

export const RAINBOW_LUNCH_SNAPSHOT: SnapshotContent = {
  dateLines: ["12 November", "Thursday"],
  locationLines: ["Koneripatti", "Rasipuram", "Namakkal"],
  keyLine: "20 elders",
  keySub: "lunch served",
  partnerLines: ["Rainbow Public", "Welfare Trust"],
  icon: "food",
};

export const RAINBOW_LUNCH_VIDEO: TestimonialContent = {
  videoSrc: `${IMG}/blessing.mp4`,
  posterSrc: `${IMG}/blessing-poster.jpg`,
  subtitle: "Hear from the elders who shared this lunch.",
  quote:
    "எங்கள் பசியைத் தீர்த்த உங்களுக்கு, அந்த கடவுள் எல்லா நன்மைகளையும் வாரி வழங்கட்டும்",
  speaker: "Elders",
  organization: RAINBOW_LUNCH_PARTNER,
};

const ACT_DESCRIPTION =
  "A warm lunch, served with care and shared at one table, because you thought of them.";
export const RAINBOW_LUNCH_ACT: ActContent = {
  heading: "Where Your Kindness Became Lunch",
  moments: [
    {
      title: "Prepared",
      image: `${IMG}/p34.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Served",
      image: `${IMG}/p30.jpg`,
      description: ACT_DESCRIPTION,
      focus: "35% 50%",
    },
    {
      title: "Shared",
      image: `${IMG}/p32.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
  ],
};

// Most recent first, inside the 12:30 - 1:15 PM window on 12 November.
const PHOTOS: {
  file: string;
  title: string;
  narrative: string;
  at: [number, number, number];
}[] = [
  {
    file: "p33.jpg",
    title: "Under the Rainbow Sign",
    narrative: "Women elders enjoying lunch beneath the trust's sign.",
    at: [13, 11, 33],
  },
  {
    file: "p32.jpg",
    title: "A Long Table, Shared",
    narrative: "A row of elders sharing lunch at one table.",
    at: [13, 2, 15],
  },
  {
    file: "p30.jpg",
    title: "First Bites",
    narrative: "Elders tucking in to rice, sambar and curry.",
    at: [12, 53, 40],
  },
  {
    file: "p29.jpg",
    title: "Both Tables Full",
    narrative: "Elders seated on both sides of the hall for lunch.",
    at: [12, 46, 7],
  },
  {
    file: "p31.jpg",
    title: "The Hall at Lunchtime",
    narrative: "The dining hall as the lunch was being shared.",
    at: [12, 38, 52],
  },
  {
    file: "p34.jpg",
    title: "Lunch Ready to Serve",
    narrative: "Rice, sambar, kootu, vada, sweets and bananas, ready to serve.",
    at: [12, 31, 18],
  },
];

function format([h, m, sec]: [number, number, number]) {
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  const h12 = h > 12 ? h - 12 : h;
  const period = h >= 12 ? "PM" : "AM";
  return {
    iso: `2026-11-12T${String(h).padStart(2, "0")}:${mm}:${ss}+05:30`,
    short: `${h12}:${mm} ${period}`,
    full: `${h12}:${mm}:${ss} ${period} GMT+5:30`,
  };
}

export const RAINBOW_LUNCH_EVIDENCE: EvidenceTraceItem[] = PHOTOS.map(
  (photo, index) => {
    const t = format(photo.at);
    return {
      id: `rainbow-lunch-evidence-${index + 1}`,
      actId: RAINBOW_LUNCH_ACT_ID,
      category: "annadhanam",
      mediaKind: "photo",
      photoUrl: `${IMG}/${photo.file}`,
      momentTitle: photo.title,
      narrative: photo.narrative,
      captureDate: "12 November 2026",
      captureDateIso: t.iso,
      captureTime: t.short,
      captureDateLong: "12 Nov 2026",
      captureTimeWithOffset: t.full,
      capturedBy: "AiA Operations",
      landmark: RAINBOW_LUNCH_PLACE,
      gpsLat: LAT,
      gpsLng: LNG,
      gpsAccuracyMeters: 0,
      approvedBy: "AiA Operations",
      approvedDate: "12 November 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: RAINBOW_LUNCH_PLACE,
        lat: LAT,
        lng: LNG,
      },
    };
  },
);

// Display IDs for the record, in the same pattern as the other pages.
export const RAINBOW_LUNCH_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Monthly Aram",
    recordId: "DD-C-00381",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: RAINBOW_LUNCH_PARTNER,
    recordId: "AL-RPW-00381",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "20 elders lunch served",
    recordId: "IM-RPW-00381",
  },
  verification: {
    dataLabel: "Status",
    dataValue: "Completed",
    recordId: "VR-RPW-00381",
  },
};

// Informational only: no button, no WhatsApp.
export const RAINBOW_LUNCH_IMPACT_BANNER = {
  title: "Coming soon: the story behind every step",
  subtitle: "See how and why your contribution was placed here",
};
