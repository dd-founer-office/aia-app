import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";
import { buildMonthlyAramBanner } from "@/lib/akshanth-raj-content";

/**
 * Content for the Vaazhga Vaazhthudan lunch served to 35 residents of Sudar
 * Matruthiranudaiyor Kapagam, Thirucherai, on 17 November 2026, booked by
 * Priya Anand (Abu Dhabi) for her son Arihant Anand's birthday. Written to
 * Priya ("you"). Presentation layer only, like lib/akshanth-raj-content.ts.
 */
export const ARIHANT_ACT_ID = "vaazhga-vaazhthudan-arihant-171126";
export const ARIHANT_ORGANIZATION = "Sudar Matruthiranudaiyor Kapagam";
export const ARIHANT_PLACE = "Thirucherai, Kumbakonam, Thanjavur";

const IMG = "/mock/vaazhga-arihant";
// Pin dropped on Sudar, Thirucherai (same as the Akshanth Raj pages).
const LAT = 10.878627;
const LNG = 79.452828;

export const ARIHANT_HERO = {
  title: "A Birthday Wish Crossed the Sea to Reach a Table",
  description:
    "Priya, on Arihant's birthday you sent a meal across the sea, and a hall of friends at Sudar folded their hands and blessed him before the first bite.",
  heroImageUrl: `${IMG}/p1.jpg`,
  imageObjectPosition: "62% 40%",
  highlightWord: "Table",
};

export const ARIHANT_SNAPSHOT: SnapshotContent = {
  dateLines: ["17 November", "Tuesday"],
  locationLines: ["Thirucherai", "Kumbakonam", "Thanjavur"],
  keyLine: "35 residents",
  keySub: "lunch served",
  partnerLines: ["Sudar Matruthiranudaiyor", "Kapagam"],
  icon: "food",
};

export const ARIHANT_TESTIMONIAL: TestimonialContent = {
  videoSrc: `${IMG}/blessing.mp4`,
  posterSrc: `${IMG}/blessing-poster.jpg`,
  subtitle: "Hear from the residents who shared this lunch.",
  quote: "நலமுடனும் மகிழ்ச்சியுடனும் நல்ல உடல் ஆரோக்கியத்துடனும் வாழவேண்டும்",
  speaker: "Residents",
  organization: ARIHANT_ORGANIZATION,
};

const ACT_DESCRIPTION =
  "A warm lunch, served with care and received with folded hands, because you thought of them on Arihant's birthday.";
export const ARIHANT_ACT: ActContent = {
  heading: "Where Your Love Became Lunch",
  moments: [
    {
      title: "Gathered",
      image: `${IMG}/p4.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Blessed",
      image: `${IMG}/p7.jpg`,
      description: ACT_DESCRIPTION,
      focus: "55% 50%",
    },
    {
      title: "Served",
      image: `${IMG}/p1.jpg`,
      description: ACT_DESCRIPTION,
      focus: "60% 50%",
    },
  ],
};

// Most recent first, inside the 12:30 - 1:00 PM window on 17 November.
const PHOTOS: {
  file: string;
  title: string;
  narrative: string;
  at: [number, number, number];
}[] = [
  {
    file: "p9.jpg",
    title: "Hands Folded in the Light",
    narrative: "Two residents folded their hands beside their plates.",
    at: [12, 58, 41],
  },
  {
    file: "p8.jpg",
    title: "Seated and Ready",
    narrative: "Residents seated along the wall, plates before them.",
    at: [12, 56, 21],
  },
  {
    file: "p7.jpg",
    title: "A Prayer Before the Meal",
    narrative: "A row of residents with their hands folded in prayer.",
    at: [12, 53, 58],
  },
  {
    file: "p6.jpg",
    title: "Heads Bowed",
    narrative: "Residents bowed their heads before the first bite.",
    at: [12, 50, 33],
  },
  {
    file: "p5.jpg",
    title: "Waiting for the Blessing",
    narrative: "A line of residents seated with plates laid out.",
    at: [12, 46, 15],
  },
  {
    file: "p4.jpg",
    title: "Gathered at the Wall",
    narrative: "Residents gathered along the wall for lunch.",
    at: [12, 42, 49],
  },
  {
    file: "p3.jpg",
    title: "The Hall Fills Up",
    narrative: "Plates laid out as residents took their places.",
    at: [12, 38, 20],
  },
  {
    file: "p2.jpg",
    title: "Together Under the Doves",
    narrative: "Residents seated under the painted doves.",
    at: [12, 34, 52],
  },
  {
    file: "p1.jpg",
    title: "Plates Ready to Serve",
    narrative: "Plates of lunch set in front of each resident.",
    at: [12, 31, 7],
  },
];

function format([h, m, sec]: [number, number, number]) {
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  const h12 = h > 12 ? h - 12 : h;
  const period = h >= 12 ? "PM" : "AM";
  return {
    iso: `2026-11-17T${String(h).padStart(2, "0")}:${mm}:${ss}+05:30`,
    short: `${h12}:${mm} ${period}`,
    full: `${h12}:${mm}:${ss} ${period} GMT+5:30`,
  };
}

export const ARIHANT_EVIDENCE: EvidenceTraceItem[] = PHOTOS.map(
  (photo, index) => {
    const t = format(photo.at);
    return {
      id: `arihant-evidence-${index + 1}`,
      actId: ARIHANT_ACT_ID,
      category: "annadhanam",
      mediaKind: "photo",
      photoUrl: `${IMG}/${photo.file}`,
      momentTitle: photo.title,
      narrative: photo.narrative,
      captureDate: "17 November 2026",
      captureDateIso: t.iso,
      captureTime: t.short,
      captureDateLong: "17 Nov 2026",
      captureTimeWithOffset: t.full,
      capturedBy: "AiA Operations",
      landmark: ARIHANT_PLACE,
      gpsLat: LAT,
      gpsLng: LNG,
      gpsAccuracyMeters: 0,
      approvedBy: "AiA Operations",
      approvedDate: "17 November 2026",
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: ARIHANT_PLACE,
        lat: LAT,
        lng: LNG,
      },
    };
  },
);

// Same record and banner as the Akshanth Raj page: no ids yet (arrow pills).
export const ARIHANT_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Vaazhga Vaazhthudan",
    recordId: "",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: ARIHANT_ORGANIZATION,
    recordId: "",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "35 residents lunch served",
    recordId: "",
  },
  verification: { dataLabel: "Status", dataValue: "Completed", recordId: "" },
};

export const ARIHANT_IMPACT_BANNER = buildMonthlyAramBanner(
  "Hi Aram in Action team, I saw the lunch served to 35 residents at Sudar Matruthiranudaiyor Kapagam for Arihant's birthday (Vaazhga Vaazhthudan). I would like to know more about joining the Monthly Aram.",
  "Learn how to keep a meal going every month",
);
