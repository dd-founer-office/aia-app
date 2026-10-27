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

// The monthly-Aram banner opens WhatsApp with a prefilled message. Set the
// number in international format without "+" (e.g. "9715XXXXXXXX"); while it
// is empty the link opens WhatsApp's own contact picker with the message.
const WHATSAPP_NUMBER = "";
const WHATSAPP_MESSAGE =
  "Hi, I'd like to know more about the Monthly Aram (Vaazhga Vaazhthudan - Akshanth Raj).";
export const AKSHANTH_WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const IMG = "/mock/vaazhga";

export const AKSHANTH_HERO = {
  title: "From Dubai, a Blessing\nReached a Plate in Thirucherai",
  description:
    "Because Akshanth Raj's thoughtfulness, thousands of kilometres away, became a warm meal for 35 residents who were remembered.",
  heroImageUrl: `${IMG}/p14.jpg`,
  imageObjectPosition: "62% 50%",
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
    {
      title: "Smiles",
      image: `${IMG}/p20.jpg`,
      description: ACT_DESCRIPTION,
      focus: "52% 50%",
    },
  ],
};

const PLACE = "Thirucherai, Kumbakonam, Thanjavur";
// Most recent first, like getPublishedActTrace(); the first three are what
// the carousel shows to begin with. No GPS is set: the evidence card only
// shows coordinates when they exist, and none were supplied.
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
    captureDateIso: "2026-10-27T09:00:00+05:30",
    captureTime: "9:00 AM",
    captureDateLong: "27 Oct 2026",
    capturedBy: "AiA Operations",
    landmark: PLACE,
    gpsLat: 0,
    gpsLng: 0,
    gpsAccuracyMeters: 0,
    approvedBy: "AiA Operations",
    approvedDate: "27 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: PLACE,
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

export const AKSHANTH_IMPACT_BANNER = {
  title: "Available only for Monthly Aram participants",
  subtitle: "Learn how to keep a meal going every month",
  buttonLabel: "Know more",
  href: AKSHANTH_WHATSAPP_URL,
};
