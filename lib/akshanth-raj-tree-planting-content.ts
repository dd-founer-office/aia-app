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
export const TREE_BIRTHDAY_PLACE = "Elandurai, Kumbakonam, Thanjavur";

const IMG = "/mock/tree-birthday";

export const TREE_BIRTHDAY_HERO = {
  title: "Some Birthdays Are Marked by Cake.\nThis One by Roots",
  description:
    "Saplings planted in Akshanth Raj's name, each one a wish that keeps growing.",
  heroImageUrl: `${IMG}/p1.jpg`,
  imageObjectPosition: "50% 45%",
  highlightWord: "Roots",
};

// confirm: date, place and partner name.
export const TREE_BIRTHDAY_SNAPSHOT: SnapshotContent = {
  dateLines: ["27 October", "Tuesday"],
  locationLines: ["Elandurai", "Kumbakonam", "Thanjavur"],
  keyLine: "Saplings planted",
  keySub: "for a birthday",
  partnerLines: ["Aram in Action", "Tree Planting Team"],
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
  "Saplings prepared, planted by hand and protected, so each one can grow strong.";
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
      title: "Growing",
      image: `${IMG}/p1.jpg`,
      description: ACT_DESCRIPTION,
      focus: "50% 50%",
    },
  ],
};

// Most recent first; the duplicate sapling shot is left out. Capture times are
// working placeholders (confirm), two minutes apart. No coordinates yet.
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
  const minute = 14 - index * 2;
  const mm = String(Math.max(minute, 0)).padStart(2, "0");
  return {
    iso: `2026-10-27T09:${mm}:00+05:30`,
    short: `9:${mm} AM`,
    full: `9:${mm}:00 AM GMT+5:30`,
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
    gpsLat: 0,
    gpsLng: 0,
    gpsAccuracyMeters: 0,
    approvedBy: "AiA Operations",
    approvedDate: "27 October 2026",
    trust: {
      kind: "map",
      verificationStatus: "verified",
      locationLabel: TREE_BIRTHDAY_PLACE,
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
  impact: { dataLabel: "Outcome", dataValue: "Saplings planted", recordId: "" },
  verification: { dataLabel: "Status", dataValue: "Completed", recordId: "" },
};

export const TREE_BIRTHDAY_IMPACT_BANNER = AKSHANTH_IMPACT_BANNER;
