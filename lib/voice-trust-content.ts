import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";

/**
 * Content for the breakfast served to 45 students at Voice Trust (Siruganur,
 * Trichy) on 28 October 2026, shared privately with the person it was
 * given for. Every line is written to her ("you"), and the copy keeps the
 * programme name out (only the record's Source line names it). Presentation layer only, like lib/akshanth-raj-content.ts.
 */
export const VOICE_TRUST_ACT_ID = "voice-trust-breakfast-281026";
export const VOICE_TRUST_PARTNER = "Voice Trust";
export const VOICE_TRUST_PLACE = "Siruganur, Trichy";

const IMG = "/mock/voice-trust";
// Pin dropped on Voice Trust in Google Maps.
const LAT = 10.846804;
const LNG = 78.699675;

export const VOICE_TRUST_HERO = {
  title: "This Morning, 45 Children\nPrayed for You",
  description:
    "Because of you, 45 children at Voice Trust began their day with a warm breakfast, and they thanked you the way they know best.",
  heroImageUrl: `${IMG}/girls.jpg`,
  imageObjectPosition: "55% 40%",
  highlightWord: "Prayed",
};

export const VOICE_TRUST_SNAPSHOT: SnapshotContent = {
  dateLines: ["28 October", "Wednesday"],
  locationLines: ["Voice Trust", "Siruganur", "Trichy"],
  keyLine: "45 students",
  keySub: "breakfast served",
  partnerLines: ["Voice Trust", "Children's Home"],
  icon: "food",
};

export const VOICE_TRUST_VIDEO: TestimonialContent = {
  videoSrc: `${IMG}/breakfast.mp4`,
  posterSrc: `${IMG}/breakfast-poster.jpg`,
  subtitle: "Hear from the children who shared this breakfast.",
  quote:
    "நீண்ட ஆயுளையும், சிறந்த எதிர்காலத்தையும், நல்ல உடல்நலத்தையும் தரவேண்டும்",
  speaker: "Children",
  organization: VOICE_TRUST_PARTNER,
};

const ACT_DESCRIPTION =
  "A warm breakfast, served with patience and a prayer of thanks, because you thought of them.";
export const VOICE_TRUST_ACT: ActContent = {
  heading: "Where Your Kindness Became Breakfast",
  moments: [
    {
      title: "Prepared",
      image: `${IMG}/food.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Served",
      image: `${IMG}/boys.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Grateful",
      image: `${IMG}/girls.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
  ],
};

// Most recent first. Times follow the wall clock in the photos and video
// (about 8:00 on the board, 8:06 in the video): the food ready at 7:57:25,
// the note of thanks on the board, then the children praying before eating.
const PHOTOS: {
  file: string;
  title: string;
  narrative: string;
  at: [number, number, number];
}[] = [
  {
    file: "boys.jpg",
    title: "Hands Folded Before Breakfast",
    narrative: "Boys paused in prayer before the first bite.",
    at: [8, 5, 9],
  },
  {
    file: "girls.jpg",
    title: "A Prayer of Thanks",
    narrative: "Girls folded their hands before eating.",
    at: [8, 3, 41],
  },
  {
    file: "board.jpg",
    title: "A Note of Thanks on the Board",
    narrative: "The children wrote a thank-you note on the blackboard.",
    at: [8, 0, 32],
  },
  {
    file: "food.jpg",
    title: "Breakfast Ready to Serve",
    narrative: "Idli, sambar, chutney and more, ready to be served.",
    at: [7, 57, 25],
  },
];

function format([h, m, sec]: [number, number, number]) {
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return {
    iso: `2026-10-28T0${h}:${mm}:${ss}+05:30`,
    short: `${h}:${mm} AM`,
    full: `${h}:${mm}:${ss} AM GMT+5:30`,
  };
}

export const VOICE_TRUST_EVIDENCE: EvidenceTraceItem[] = PHOTOS.map(
  (photo, index) => {
    const t = format(photo.at);
    return {
      id: `voice-trust-evidence-${index + 1}`,
      actId: VOICE_TRUST_ACT_ID,
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
      landmark: VOICE_TRUST_PLACE,
      gpsLat: LAT,
      gpsLng: LNG,
      gpsAccuracyMeters: 0,
      approvedBy: "AiA Operations",
      approvedDate: "28 October 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: VOICE_TRUST_PLACE,
        lat: LAT,
        lng: LNG,
      },
    };
  },
);

// Display IDs for the record, in the same pattern as the other pages.
export const VOICE_TRUST_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Monthly Aram",
    recordId: "DD-C-00312",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: VOICE_TRUST_PARTNER,
    recordId: "AL-VTS-00312",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "45 students breakfast served",
    recordId: "IM-VTS-00312",
  },
  verification: {
    dataLabel: "Status",
    dataValue: "Completed",
    recordId: "VR-VTS-00312",
  },
};

// Informational only: no button, no WhatsApp. It previews the next feature:
// the open process behind each step and why the contribution went where it did.
export const VOICE_TRUST_IMPACT_BANNER = {
  title: "Coming soon: the story behind every step",
  subtitle: "See how and why your contribution was placed here",
};
