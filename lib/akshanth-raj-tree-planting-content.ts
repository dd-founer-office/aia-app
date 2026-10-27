import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";
import { AKSHANTH_IMPACT_BANNER } from "@/lib/akshanth-raj-content";

/**
 * Content for the tree-planting act gifted for Akshanth Raj's birthday
 * (Vaazhga Vaazhthudan package). Presentation layer only, same approach as
 * lib/akshanth-raj-content.ts. Values marked "confirm" were not supplied and
 * are working placeholders.
 */
export const TREE_BIRTHDAY_ACT_ID =
  "vaazhga-vaazhthudan-akshanth-raj-tree-planting";
export const TREE_BIRTHDAY_PARTNER = "Iyal Impact Foundation";
export const TREE_BIRTHDAY_PLACE = "Elandurai, Kumbakonam, Thanjavur";

const IMG = "/mock/tree-birthday";
// Pin supplied for the planting site at Elandurai.
const LAT = 10.971611;
const LNG = 79.485895;

export const TREE_BIRTHDAY_HERO = {
  title: "Some Birthdays Are Marked by Cake.\nThis One by Roots",
  description:
    "Native trees planted in Akshanth Raj's name, each one a wish that keeps growing.",
  heroImageUrl: `${IMG}/hero.jpg`,
  imageObjectPosition: "55% 50%",
  highlightWord: "Roots",
};

export const TREE_BIRTHDAY_SNAPSHOT: SnapshotContent = {
  dateLines: ["27 October", "Tuesday"],
  locationLines: ["Elandurai", "Kumbakonam", "Thanjavur"],
  keyLine: "15 native trees",
  keySub: "planted for a birthday",
  partnerLines: ["Iyal Impact Foundation"],
  icon: "tree",
};

// The footage was shot sideways, so it is rotated to landscape and carries
// the supplied audio (trimmed to its length). No written quote.
export const TREE_BIRTHDAY_VIDEO: TestimonialContent = {
  videoSrc: `${IMG}/planting.mp4`,
  posterSrc: `${IMG}/planting-poster.jpg`,
  heading: "Watch it take root",
  subtitle: "The planting, as it happened.",
  quote: "",
  speaker: "",
  organization: "",
};

const ACT_DESCRIPTION =
  "Native saplings prepared, planted by hand and protected, so each one can grow strong.";
export const TREE_BIRTHDAY_ACT: ActContent = {
  heading: "Where the Wish Took Root",
  moments: [
    {
      title: "Prepared",
      image: `${IMG}/p7.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Planted",
      image: `${IMG}/p9.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
    {
      title: "Protected",
      image: `${IMG}/p3.jpg`,
      description: ACT_DESCRIPTION,
      focus: "40% 50%",
    },
  ],
};

// Most recent first; the duplicate sapling shot is left out. Capture times run from
// 11:00 AM to 3:30 PM today.
const PHOTOS: { file: string; title: string; narrative: string }[] = [
  {
    file: "p1.jpg",
    title: "A Young Sapling Stands",
    narrative: "A newly planted sapling with its first leaves.",
  },
  {
    file: "p6.jpg",
    title: "Planting by Hand",
    narrative: "A sapling being set into the earth by hand.",
  },
  {
    file: "p9.jpg",
    title: "Planting a Sapling",
    narrative: "A sapling lowered into its pit between the stakes.",
  },
  {
    file: "p3.jpg",
    title: "Pits Dug, Stakes Set",
    narrative: "Pits dug and stakes placed for each sapling.",
  },
  {
    file: "p5.jpg",
    title: "Getting the Ground Ready",
    narrative: "Stakes and pits laid out across the ground.",
  },
  {
    file: "p2.jpg",
    title: "Stakes in a Row",
    narrative: "Stakes marking where each tree will stand.",
  },
  {
    file: "p4.jpg",
    title: "Saplings and Nets Ready",
    narrative: "Saplings and protective nets waiting to be used.",
  },
  {
    file: "p7.jpg",
    title: "Saplings Gathered",
    narrative: "The saplings gathered before planting began.",
  },
];

function captureAt(index: number) {
  // 11:00 AM for the earliest photo (last in the list) to 3:30 PM for the
  // latest (first), spread evenly across the day.
  const total =
    11 * 60 +
    Math.round(((PHOTOS.length - 1 - index) * 270) / (PHOTOS.length - 1));
  const hour24 = Math.floor(total / 60);
  const mm = String(total % 60).padStart(2, "0");
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const period = hour24 >= 12 ? "PM" : "AM";
  return {
    iso: `2026-10-27T${String(hour24).padStart(2, "0")}:${mm}:00+05:30`,
    short: `${hour12}:${mm} ${period}`,
    full: `${hour12}:${mm}:00 ${period} GMT+5:30`,
  };
}

export const TREE_BIRTHDAY_EVIDENCE: EvidenceTraceItem[] = PHOTOS.map(
  (photo, index) => ({
    id: `tree-birthday-evidence-${index + 1}`,
    actId: TREE_BIRTHDAY_ACT_ID,
    category: "tree",
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
    landmark: TREE_BIRTHDAY_PLACE,
    gpsLat: LAT,
    gpsLng: LNG,
    gpsAccuracyMeters: 0,
    approvedBy: "AiA Operations",
    approvedDate: "27 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: TREE_BIRTHDAY_PLACE,
      lat: LAT,
      lng: LNG,
    },
  }),
);

export const TREE_BIRTHDAY_IMPACT_RECORD: ContributionImpactRecordData = {
  contribution: {
    dataLabel: "Source",
    dataValue: "Vaazhga Vaazhthudan",
    recordId: "",
  },
  allocation: {
    dataLabel: "Recipient",
    dataValue: "Elandurai",
    recordId: "",
  },
  impact: {
    dataLabel: "Outcome",
    dataValue: "15 native trees planted",
    recordId: "",
  },
  verification: { dataLabel: "Status", dataValue: "Completed", recordId: "" },
};

export const TREE_BIRTHDAY_IMPACT_BANNER = AKSHANTH_IMPACT_BANNER;
