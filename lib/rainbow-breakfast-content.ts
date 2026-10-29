import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";

/**
 * Content for the breakfast served to 20 elders at Rainbow Muthiyor Illam
 * (Rainbow Public Welfare Trust, Koneripatti, Rasipuram) on 29 October 2026,
 * shared privately with Marimuthu, who gave it. Written to him ("you"); the
 * copy keeps the programme name out (only the record's Source line names it).
 * Presentation layer only, like lib/rainbow-content.ts.
 */
export const RAINBOW_BREAKFAST_ACT_ID = "rainbow-breakfast-291026";
export const RAINBOW_BREAKFAST_PARTNER = "Rainbow Public Welfare Trust";
export const RAINBOW_BREAKFAST_PLACE = "Koneripatti, Rasipuram, Namakkal";

const IMG = "/mock/rainbow-breakfast";
// Same pin as the other Rainbow Muthiyor Illam page.
const LAT = 11.460451;
const LNG = 78.1973901;

export const RAINBOW_BREAKFAST_HERO = {
  title: "Today, Their Morning\nTasted Like Home",
  description:
    "You sent warm idli, crisp vada and sambar to a long table of 20 elders, and for one morning, home was right there on their plates.",
  heroImageUrl: `${IMG}/p4.jpg`,
  imageObjectPosition: "30% 50%",
  highlightWord: "Home",
};

export const RAINBOW_BREAKFAST_SNAPSHOT: SnapshotContent = {
  dateLines: ["29 October", "Thursday"],
  locationLines: ["Koneripatti", "Rasipuram", "Namakkal"],
  keyLine: "20 elders",
  keySub: "breakfast served",
  partnerLines: ["Rainbow Public", "Welfare Trust"],
  icon: "food",
};

export const RAINBOW_BREAKFAST_VIDEO: TestimonialContent = {
  videoSrc: `${IMG}/breakfast.mp4`,
  posterSrc: `${IMG}/breakfast-poster.jpg`,
  subtitle: "Hear from the elders who shared this morning.",
  quote:
    "மாறாத கருணையோடும், பன்மடங்கு செல்வத்தோடும், பல்லாண்டு வாழ ஆசீர்வதிக்கிறோம்",
  speaker: "Elders",
  organization: RAINBOW_BREAKFAST_PARTNER,
};

const ACT_DESCRIPTION =
  "A warm breakfast, served with care and shared at one table, because you thought of them.";
export const RAINBOW_BREAKFAST_ACT: ActContent = {
  heading: "Where Your Kindness Became a Morning Meal",
  moments: [
    {
      title: "Prepared",
      image: `${IMG}/p1.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Served",
      image: `${IMG}/p2.jpg`,
      description: ACT_DESCRIPTION,
      focus: "35% 50%",
    },
    {
      title: "Shared",
      image: `${IMG}/p6.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
  ],
};

// Most recent first, inside the 8:07 - 8:35 AM window on 29 October.
const PHOTOS: {
  file: string;
  title: string;
  narrative: string;
  at: [number, number, number];
}[] = [
  {
    file: "p6.jpg",
    title: "Everyone at the Table",
    narrative: "Both tables full as the breakfast was shared.",
    at: [8, 34, 56],
  },
  {
    file: "p7.jpg",
    title: "A Hearty Morning Meal",
    narrative: "Elders enjoying idli, vada and rice.",
    at: [8, 30, 21],
  },
  {
    file: "p4.jpg",
    title: "First Bites",
    narrative: "Elders tucking in to their breakfast.",
    at: [8, 26, 44],
  },
  {
    file: "p5.jpg",
    title: "Eating Together",
    narrative: "A long table of elders sharing breakfast.",
    at: [8, 23, 9],
  },
  {
    file: "p8.jpg",
    title: "Under the Rainbow Sign",
    narrative: "Women elders enjoying breakfast beneath the trust's sign.",
    at: [8, 19, 30],
  },
  {
    file: "p3.jpg",
    title: "Enjoying the Meal",
    narrative: "Elders eating their breakfast side by side.",
    at: [8, 16, 52],
  },
  {
    file: "p2.jpg",
    title: "Settling In at the Table",
    narrative: "Elders taking their places for breakfast.",
    at: [8, 12, 18],
  },
  {
    file: "p1.jpg",
    title: "Breakfast Ready to Serve",
    narrative: "Idli, sambar, vada, bonda, rice and bananas, ready to serve.",
    at: [8, 7, 41],
  },
];

function format([h, m, sec]: [number, number, number]) {
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return {
    iso: `2026-10-29T0${h}:${mm}:${ss}+05:30`,
    short: `${h}:${mm} AM`,
    full: `${h}:${mm}:${ss} AM GMT+5:30`,
  };
}

export const RAINBOW_BREAKFAST_EVIDENCE: EvidenceTraceItem[] = PHOTOS.map(
  (photo, index) => {
    const t = format(photo.at);
    return {
      id: `rainbow-breakfast-evidence-${index + 1}`,
      actId: RAINBOW_BREAKFAST_ACT_ID,
      category: "annadhanam",
      mediaKind: "photo",
      photoUrl: `${IMG}/${photo.file}`,
      momentTitle: photo.title,
      narrative: photo.narrative,
      captureDate: "29 October 2026",
      captureDateIso: t.iso,
      captureTime: t.short,
      captureDateLong: "29 Oct 2026",
      captureTimeWithOffset: t.full,
      capturedBy: "AiA Operations",
      landmark: RAINBOW_BREAKFAST_PLACE,
      gpsLat: LAT,
      gpsLng: LNG,
      gpsAccuracyMeters: 0,
      approvedBy: "AiA Operations",
      approvedDate: "29 October 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: RAINBOW_BREAKFAST_PLACE,
        lat: LAT,
        lng: LNG,
      },
    };
  },
);

// Display IDs for the record, in the same pattern as the other pages.
export const RAINBOW_BREAKFAST_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Monthly Aram",
    recordId: "DD-C-00362",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: RAINBOW_BREAKFAST_PARTNER,
    recordId: "AL-RPW-00362",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "20 elders breakfast served",
    recordId: "IM-RPW-00362",
  },
  verification: {
    dataLabel: "Status",
    dataValue: "Completed",
    recordId: "VR-RPW-00362",
  },
};

// Informational only: no button, no WhatsApp.
export const RAINBOW_BREAKFAST_IMPACT_BANNER = {
  title: "Coming soon: the story behind every step",
  subtitle: "See how and why your contribution was placed here",
};
