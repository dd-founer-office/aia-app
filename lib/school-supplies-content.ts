import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import type { ContributionImpactRecordData } from "@/components/acts/ContributionImpactRecord";
import type { SnapshotContent } from "@/components/acts/ActSnapshot";
import type { ActContent } from "@/components/acts/ActTheAct";
import type { TestimonialContent } from "@/components/acts/ActTestimonial";

/**
 * Two private pages for the same act: a full school year of supplies (books,
 * notebooks, bags, uniform, footwear, stationery) for two +2 students,
 * Roshini and Inbarasu, handed over at Rainbow Public Welfare Trust,
 * Koneripatti, Rasipuram, on 17 November 2026. One page for each contributor,
 * Marimuthu and Vinothkumar (whose page is dedicated to his children
 * Vetrivendhan and Keerthanya). Both Monthly Aram contributors; the copy keeps
 * the programme name out (only the record's Source line names it). The trust's
 * location is shown as text only, with no map pin, because students appear.
 */
const PARTNER = "Rainbow Public Welfare Trust";
const PLACE = "Koneripatti, Rasipuram, Namakkal";
const IMG = "/mock/school-supplies";

const SNAPSHOT: SnapshotContent = {
  dateLines: ["17 November", "Tuesday"],
  locationLines: ["Koneripatti", "Rasipuram", "Namakkal"],
  keyLine: "2 students",
  keySub: "a school year supplied",
  partnerLines: ["Rainbow Public", "Welfare Trust"],
  icon: "education",
};

// Most recent first, inside the 7:18 - 7:42 PM window on 17 November.
const PHOTOS: {
  file: string;
  title: string;
  narrative: string;
  at: [number, number, number];
}[] = [
  {
    file: "p6.jpg",
    title: "Together After the Handover",
    narrative: "The supplies handed over beside the trust's sign.",
    at: [19, 41, 27],
  },
  {
    file: "p1.jpg",
    title: "Supplies Received",
    narrative: "A student receiving a new bag and books.",
    at: [19, 35, 44],
  },
  {
    file: "p2.jpg",
    title: "A Bag and Books for the Year",
    narrative: "A student receiving a bag and notebooks.",
    at: [19, 30, 9],
  },
  {
    file: "p3.jpg",
    title: "A Bag Filled With Stationery",
    narrative: "A new bag packed with pens, pencils and geometry tools.",
    at: [19, 23, 52],
  },
  {
    file: "p4.jpg",
    title: "Uniform, Footwear and Stationery",
    narrative: "A uniform, footwear and stationery set out in order.",
    at: [19, 21, 15],
  },
  {
    file: "p5.jpg",
    title: "Everything Laid Out",
    narrative: "Two sets of books, bags, uniform and footwear laid out.",
    at: [19, 18, 40],
  },
];

function format([h, m, sec]: [number, number, number]) {
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return {
    iso: `2026-11-17T${String(h).padStart(2, "0")}:${mm}:${ss}+05:30`,
    short: `${h - 12}:${mm} PM`,
    full: `${h - 12}:${mm}:${ss} PM GMT+5:30`,
  };
}

function evidence(idPrefix: string, actId: string): EvidenceTraceItem[] {
  return PHOTOS.map((photo, index) => {
    const t = format(photo.at);
    return {
      id: `${idPrefix}-evidence-${index + 1}`,
      actId,
      category: "student",
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
      landmark: PLACE,
      gpsLat: 0,
      gpsLng: 0,
      gpsAccuracyMeters: 0,
      approvedBy: "AiA Operations",
      approvedDate: "17 November 2026",
      // No lat/lng: the card shows the trust's place name only.
      trust: {
        kind: "map",
        verificationStatus: "verified",
        locationLabel: PLACE,
      },
    };
  });
}

function video(file: string): TestimonialContent {
  return {
    videoSrc: `${IMG}/${file}.mp4`,
    posterSrc: `${IMG}/${file}-poster.jpg`,
    subtitle: "Hear from the parents of Roshini and Inbarasu.",
    quote: "மனமார்ந்த நன்றி",
    speaker: "Parents",
    organization: "of Roshini and Inbarasu, +2 students",
  };
}

function act(description: string): ActContent {
  return {
    heading: "Where Your Kindness Became a School Year",
    moments: [
      {
        title: "Packed",
        image: `${IMG}/p3.jpg`,
        description,
        focus: "50% 50%",
      },
      {
        title: "Received",
        image: `${IMG}/p1.jpg`,
        description,
        focus: "45% 40%",
      },
      {
        title: "Thanked",
        image: `${IMG}/p2.jpg`,
        description,
        focus: "50% 40%",
      },
    ],
  };
}

function record(idNumber: string): ContributionImpactRecordData {
  return {
    contribution: {
      dataLabel: "Source",
      dataValue: "Monthly Aram",
      recordId: `DD-C-${idNumber}`,
    },
    allocation: {
      dataLabel: "Recipient",
      dataValue: PARTNER,
      recordId: `AL-RPW-${idNumber}`,
    },
    impact: {
      dataLabel: "Outcome",
      dataValue: "2 students, school year supplied",
      recordId: `IM-RPW-${idNumber}`,
    },
    verification: {
      dataLabel: "Status",
      dataValue: "Completed",
      recordId: `VR-RPW-${idNumber}`,
    },
  };
}

// Informational only: no button, no WhatsApp.
const BANNER = {
  title: "Coming soon: the story behind every step",
  subtitle: "See how and why your contribution was placed here",
};

export const MARIMUTHU_SCHOOL_ACT_ID = "school-year-marimuthu-171126";
export const MARIMUTHU_SCHOOL_PARTNER = PARTNER;
export const MARIMUTHU_SCHOOL_HERO = {
  title: "A Whole School Year Packed in One Bag",
  description:
    "Marimuthu, you gave Roshini and Inbarasu everything for their +2 year: books, notebooks, a bag, uniform, footwear and stationery.",
  heroImageUrl: `${IMG}/p1.jpg`,
  imageObjectPosition: "45% 35%",
  highlightWord: "Year",
};
export const MARIMUTHU_SCHOOL_SNAPSHOT = SNAPSHOT;
export const MARIMUTHU_SCHOOL_VIDEO = video("marimuthu");
export const MARIMUTHU_SCHOOL_ACT = act(
  "Books, notebooks, bags, uniform, footwear and stationery, handed to two students for their whole +2 year, because you thought of them.",
);
export const MARIMUTHU_SCHOOL_EVIDENCE = evidence(
  "marimuthu-school",
  MARIMUTHU_SCHOOL_ACT_ID,
);
export const MARIMUTHU_SCHOOL_IMPACT_RECORD = record("00404");
export const MARIMUTHU_SCHOOL_IMPACT_BANNER = BANNER;

export const VINOTHKUMAR_SCHOOL_ACT_ID = "school-year-vinothkumar-171126";
export const VINOTHKUMAR_SCHOOL_PARTNER = PARTNER;
export const VINOTHKUMAR_SCHOOL_HERO = {
  title: "A School Year Given in Two Names",
  description:
    "Vinothkumar, you gave Roshini and Inbarasu a full +2 year of supplies, dedicated to your children, Vetrivendhan and Keerthanya.",
  heroImageUrl: `${IMG}/p2.jpg`,
  imageObjectPosition: "50% 30%",
  highlightWord: "Names",
};
export const VINOTHKUMAR_SCHOOL_SNAPSHOT = SNAPSHOT;
export const VINOTHKUMAR_SCHOOL_VIDEO = video("vinothkumar");
export const VINOTHKUMAR_SCHOOL_ACT = act(
  "Dedicated to Vetrivendhan and Keerthanya: books, notebooks, bags, uniform, footwear and stationery for two students for their whole +2 year.",
);
export const VINOTHKUMAR_SCHOOL_EVIDENCE = evidence(
  "vinothkumar-school",
  VINOTHKUMAR_SCHOOL_ACT_ID,
);
export const VINOTHKUMAR_SCHOOL_IMPACT_RECORD = record("00405");
export const VINOTHKUMAR_SCHOOL_IMPACT_BANNER = BANNER;
