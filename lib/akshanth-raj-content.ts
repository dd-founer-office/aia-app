import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";

/**
 * Content for the Vaazhga Vaazhthudan package gifted by Akshanth Raj
 * (Dubai): an annadhanam served to 35 residents of Sudar
 * Matruthiranudaiyor Kapagam, Thirucherai. Presentation layer only, same
 * approach as lib/act-content-overrides.ts -- nothing here is read from or
 * written to Supabase. It reuses the Annadhanam act id only because the
 * shared components key their built-in copy off it; every visible value
 * comes from this file.
 */
export const AKSHANTH_ACT_ID = "vaazhga-vaazhthudan-akshanth-raj";
export const AKSHANTH_ORGANIZATION = "Sudar Matruthiranudaiyor Kapagam";

// The monthly-Aram banner opens WhatsApp with a prefilled message that names
// the act the visitor is looking at, so each page passes its own.
const WHATSAPP_NUMBER = "971582267155";
export function buildMonthlyAramBanner(message: string, subtitle: string) {
  return {
    title: "Available only for Monthly Aram participants",
    subtitle,
    buttonLabel: "Know more",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
  };
}

const IMG = "/mock/vaazhga";

export const AKSHANTH_HERO = {
  title: "From Dubai, a Blessing\nReached a Plate in Thirucherai",
  description:
    "Because Akshanth Raj's thoughtfulness, thousands of kilometres away, became a warm meal for 35 residents who were remembered.",
  heroImageUrl: `${IMG}/hero.jpg`,
  imageObjectPosition: "52% 50%",
  highlightWord: "Blessing",
};

export const AKSHANTH_SNAPSHOT: SnapshotContent = {
  dateLines: ["27 October", "Tuesday"],
  locationLines: ["Thirucherai", "Kumbakonam", "Thanjavur"],
  keyLine: "35 residents",
  keySub: "served with care",
  partnerLines: ["Sudar Matruthiranudaiyor", "Kapagam"],
  icon: "food",
};

export const AKSHANTH_TESTIMONIAL: TestimonialContent = {
  videoSrc: `${IMG}/testimonial.mp4`,
  posterSrc: `${IMG}/testimonial-poster.jpg`,
  subtitle: "Hear from the residents who shared this meal.",
  quote: "நீண்ட ஆயுள், நிறைந்த செல்வம், இயன்ற பெரும் புகழ் பெறுவார்கள்",
  speaker: "Residents",
  organization: AKSHANTH_ORGANIZATION,
};

const ACT_DESCRIPTION =
  "A simple meal, served with patience and respect, to 35 residents who were seen, welcomed and fed.";
export const AKSHANTH_ACT: ActContent = {
  heading: "Where the Blessing Landed",
  moments: [
    {
      title: "Grateful",
      image: `${IMG}/p18.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Served",
      image: `${IMG}/p19.jpg`,
      description: ACT_DESCRIPTION,
      focus: "62% 50%",
    },
    {
      title: "Together",
      image: `${IMG}/p16.jpg`,
      description: ACT_DESCRIPTION,
      focus: "78% 50%",
    },
  ],
};

// This morning, 8:00 - 8:20 AM IST: the first (most recent) photo is the
// latest minute and each earlier one is two minutes before it.
function captureAt(index: number) {
  const minute = 18 - index * 2;
  const mm = String(Math.max(minute, 0)).padStart(2, "0");
  return {
    iso: `2026-10-27T08:${mm}:00+05:30`,
    short: `8:${mm} AM`,
    full: `8:${mm}:00 AM GMT+5:30`,
  };
}

// Pin dropped on the venue in Google Maps (Sudar Academy and Charitable
// Trust, North St, Thirucherai).
const LAT = 10.878627;
const LNG = 79.452828;
const PLACE = "Thirucherai, Kumbakonam, Thanjavur";
// Most recent first, like getPublishedActTrace(); the first three are what
// the carousel shows to begin with.
const EVIDENCE_PHOTOS: { file: string; title: string; narrative: string }[] = [
  {
    file: "p14.jpg",
    title: "Gathered for the Meal",
    narrative: "Residents seated together as the meal was served.",
  },
  {
    file: "p18.jpg",
    title: "Hands Folded in Gratitude",
    narrative: "Two residents folded their hands before eating.",
  },
  {
    file: "p19.jpg",
    title: "A Warm Meal on Every Plate",
    narrative: "Plates laid out in front of each resident.",
  },
  {
    file: "p16.jpg",
    title: "Waiting to Be Served",
    narrative: "Residents sat along the wall as plates were placed.",
  },
  {
    file: "p20.jpg",
    title: "A Moment of Prayer",
    narrative: "Residents paused in prayer before the meal.",
  },
  {
    file: "p15.jpg",
    title: "Sharing the Meal",
    narrative: "Residents eating together in the dining hall.",
  },
  {
    file: "p11.jpg",
    title: "Seated Together",
    narrative: "Residents sat side by side with their plates.",
  },
  {
    file: "p12.jpg",
    title: "Plates Laid Out With Care",
    narrative: "Each plate served with the same care.",
  },
  {
    file: "p17.jpg",
    title: "Heads Bowed Before Eating",
    narrative: "A quiet moment before the first bite.",
  },
  {
    file: "p13.jpg",
    title: "Together at the Meal",
    narrative: "The whole row of residents sharing one meal.",
  },
];

export const AKSHANTH_EVIDENCE: EvidenceTraceItem[] = EVIDENCE_PHOTOS.map(
  (photo, index) => ({
    id: `akshanth-evidence-${index + 1}`,
    actId: AKSHANTH_ACT_ID,
    category: "annadhanam",
    mediaKind: "photo",
    photoUrl: `${IMG}/${photo.file}`,
    momentTitle: photo.title,
    narrative: photo.narrative,
    captureDate: "27 October 2026",
    captureDateIso: captureAt(index).iso,
    captureTime: captureAt(index).short,
    captureDateLong: "27 Oct 2026",
    captureTimeWithOffset: captureAt(index).full,
    capturedBy: "AiA Operations",
    landmark: PLACE,
    gpsLat: LAT,
    gpsLng: LNG,
    gpsAccuracyMeters: 0,
    approvedBy: "AiA Operations",
    approvedDate: "27 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: PLACE,
      lat: LAT,
      lng: LNG,
    },
  }),
);

export const AKSHANTH_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Vaazhga Vaazhthudan",
    recordId: "",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: AKSHANTH_ORGANIZATION,
    recordId: "",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "35 residents served",
    recordId: "",
  },
  verification: { dataLabel: "Status", dataValue: "Completed", recordId: "" },
};

export const AKSHANTH_IMPACT_BANNER = buildMonthlyAramBanner(
  "Hi Aram in Action team, I saw Akshanth Raj's Vaazhga Vaazhthudan meal for 35 residents at Sudar Matruthiranudaiyor Kapagam. I would like to know more about joining the Monthly Aram.",
  "Learn how to keep a meal going every month",
);
