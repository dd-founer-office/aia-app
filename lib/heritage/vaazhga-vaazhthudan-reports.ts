/**
 * Content for Heritage Gifting "Vaazhga Vaazhthudan" (birthday blessing)
 * report pages.
 *
 * Heritage Gifting is its own Distant Devotion identity and is deliberately
 * kept apart from Aram in Action: its own route tree (app/heritage-gifting),
 * its own components (components/heritage) and its own content (this
 * folder). Copy voice rules live in docs/heritage-gifting-voice.md.
 *
 * Each report is the private, no-sign-in page we send to the person who
 * sent the blessing. The URL carries an unguessable id (the last segment of
 * the slug) and the page is marked noindex. Nothing here is read from or
 * written to Supabase: a report is a typed entry in REPORTS, the same
 * presentation-layer approach as lib/akshanth-raj-content.ts.
 */

export type Pronouns = {
  /** "he" / "she" / "they" */
  subject: string;
  /** "him" / "her" / "them" */
  object: string;
  /** "his" / "her" / "their" */
  possessive: string;
};

export type ReportPhoto = {
  /** Stable key, referenced by TILE_ROWS. */
  key: PhotoKey;
  src: string;
  /** Short heading shown under the swipe row while this photo is centred. */
  heading: string;
  /** The gift page's own heading for this photo, when it differs. */
  giftHeading?: string;
  /** One grey line under the heading, written to the person who sent it. */
  line: string;
  /** The same line written to the birthday person, when it needs to differ. */
  giftLine?: string;
};

export type Tracker = {
  /** Display dates, e.g. "27 October". A step is done once its date is set. */
  blessedOn?: string;
  packedOn?: string;
  shippedOn?: string;
  deliveredOn?: string;
  /** Courier reference shown under "On its way". */
  courierRef?: string;
  /** Courier tracking page. The "Track your parcel" button needs this. */
  trackUrl?: string;
};

export type Gift = {
  /** `<name>-<id2>`, the last URL segment of the gift page. Own unguessable id. */
  slug: string;
  /** Who sent the blessing, as the birthday person sees it. */
  sender: string;
  /** How the sender is known to the birthday person ("Amma", "Appa"). Shown with the sign-off. */
  relation?: string;
  birthday: string;
  star: string;
  /** Short temple name for the fact card. */
  templeShort: string;
  tracker: Tracker;
  /** Opening clip. Until it exists the opener shows the poster photo. */
  videoSrc?: string;
};

/**
 * Story wording that belongs to one booking. Anything left out falls back to
 * the standard copy, so a booking without a story reads as it always has.
 */
export type Story = {
  /** Replaces the report's hero paragraphs (written to the booker). */
  reportHero?: string[];
  /** Replaces the gift page's hero paragraphs (written to the birthday person). */
  giftHero?: string[];
  /** What the parcel holds, as in "his <parcel> are being packed". Default: blessed prasadam and sankalpam card. */
  parcel?: string;
};

export type PhotoKey =
  | "gopuram"
  | "gate"
  | "signboard"
  | "sankalpam"
  | "lamps"
  | "offerings"
  | "flowers"
  | "on-the-way"
  | "courtyard"
  | "hall"
  | "corner";

export type VaazhgaReport = {
  /** `<name>-<id>`, the last URL segment. The id must be unguessable. */
  slug: string;
  /** First name of the person the blessing is for. */
  recipient: string;
  pronouns: Pronouns;
  /** The deity / temple name as it reads in "before <deity>". */
  deity: string;
  /** The deity on his own, as in "<deityShort>'s blessings". */
  deityShort: string;
  /** The deity in Tamil, in the form used in the closing blessing ("முருகனின்"). */
  deityTamil: string;
  /** The place of the temple, as in "offered in prayer at <place>". */
  place: string;
  /** Opening photo for the lamp section and the gift preview. */
  lampSrc: string;
  /** The swipe row, in order. */
  photos: ReportPhoto[];
  /** Index of the photo centred when the row first appears. */
  initialPhotoIndex: number;
  /** The page the recipient sees, reached from the report's send button. */
  gift: Gift;
  story?: Story;
};

/** Internal and public (heritage host) paths of a gift page. */
export function giftPaths(giftSlug: string) {
  return {
    internal: `/heritage-gifting/vaazhga-vaazhthudan/blessings/${giftSlug}`,
    public: `/vaazhga-vaazhthudan/blessings/${giftSlug}`,
  };
}

/**
 * The three rows of photo tiles in the hero. Entries are PhotoKeys, or
 * "logo" for a tile carrying the Vaazhga Vaazhthudan lettering. Rows 1 and
 * 2 sit inside the hero; row 3 straddles its bottom edge.
 */
export const TILE_ROWS: (PhotoKey | "logo")[][] = [
  ["gopuram", "lamps", "sankalpam", "logo", "offerings", "flowers"],
  ["on-the-way", "gate", "logo", "hall", "corner", "gopuram"],
  ["sankalpam", "logo", "offerings", "signboard", "flowers", "gate"],
];

const AKSHANTH_SLUG = "akshanth-raj-k4t9wz";
const AKSHANTH_GIFT_SLUG = "akshanth-raj-p7m3qd";
const AKSHANTH_DIR = `/heritage/reports/${AKSHANTH_SLUG}`;

const ARIHANT_SLUG = "arihant-9pq576mp";
const ARIHANT_GIFT_SLUG = "arihant-xc5m7nit";
const ARIHANT_DIR = `/heritage/reports/${ARIHANT_SLUG}`;

const REPORTS: Record<string, VaazhgaReport> = {
  [ARIHANT_SLUG]: {
    slug: ARIHANT_SLUG,
    recipient: "Arihant",
    pronouns: { subject: "he", object: "him", possessive: "his" },
    deity: "Maha Saraswathi Amman",
    deityShort: "Saraswathi Amman",
    deityTamil: "சரஸ்வதி அம்மனின்",
    place: "Koothanur",
    lampSrc: `${ARIHANT_DIR}/plaque.jpg`,
    initialPhotoIndex: 2,
    gift: {
      slug: ARIHANT_GIFT_SLUG,
      // The sender is chosen by the booker in the writing box and travels in the link.
      sender: "",
      birthday: "17 November",
      star: "Poosam",
      templeShort: "Koothanur",
      tracker: { blessedOn: "17 November" },
    },
    story: {
      reportHero: [
        "Arihant's first letters were written at Koothanur's Saraswathi Amman temple. This year, as he prepares for his 10th public exams, you wanted that same blessing with him on his birthday.",
        "A pen placed at the Amman's feet, with blessed prasadam, will travel to Abu Dhabi: a birthday wish, a prayer and your love, brought a little closer.",
      ],
      giftHero: [
        "Your first letters were written at Saraswathi Amman's temple in Koothanur. As your 10th public exams near, someone who holds you dear wanted the Amman's blessings to reach you in Abu Dhabi: a pen placed at her feet, and blessed prasadam.",
      ],
      parcel: "blessed pen and prasadam",
    },
    photos: [
      {
        key: "gopuram",
        src: `${ARIHANT_DIR}/temple.jpg`,
        heading: "The temple",
        giftHeading: "Where your first letters were written",
        line: "Koothanur's Saraswathi Amman temple, where Arihant's name was offered.",
        giftLine: "Saraswathi Amman's temple at Koothanur, where your name was offered.",
      },
      {
        key: "signboard",
        src: `${ARIHANT_DIR}/board.jpg`,
        heading: "The temple at Koothanur",
        giftHeading: "Your temple at Koothanur",
        line: "Arulmigu Maha Saraswathi Amman Thirukoil, in Thiruvarur district.",
      },
      {
        key: "hall",
        src: `${ARIHANT_DIR}/plaque.jpg`,
        heading: "Before Saraswathi Amman",
        line: "The Amman, garlanded in marigold, with lamps lit before her.",
      },
      {
        key: "lamps",
        src: `${ARIHANT_DIR}/flame.jpg`,
        heading: "A flame, lit in his name",
        giftHeading: "A flame, lit in your name",
        line: "Clay lamps, lit at the shrine.",
      },
      {
        key: "flowers",
        src: `${ARIHANT_DIR}/lamps.jpg`,
        heading: "Lamps before the Amman",
        line: "Many lamps, lit by many hands.",
      },
      {
        key: "corner",
        src: `${ARIHANT_DIR}/flame-low.jpg`,
        heading: "A quiet moment",
        giftHeading: "A quiet moment at Koothanur",
        line: "Flames burning low at the shrine.",
      },
      {
        key: "sankalpam",
        src: `${ARIHANT_DIR}/card.jpg`,
        heading: "Arihant, remembered in prayer",
        giftHeading: "Your name and star",
        line: "His name and star, written for the offering.",
        giftLine: "Your name and star, written for the offering.",
      },
      {
        key: "offerings",
        src: `${ARIHANT_DIR}/pen.jpg`,
        heading: "The pen, placed at the Amman's feet",
        giftHeading: "Your pen, at the Amman's feet",
        line: "Blessed with an archanai, ready for its journey to Abu Dhabi.",
        giftLine: "Blessed with an archanai, ready to travel to you in Abu Dhabi.",
      },
    ],
  },
  [AKSHANTH_SLUG]: {
    slug: AKSHANTH_SLUG,
    recipient: "Akshanth",
    pronouns: { subject: "he", object: "him", possessive: "his" },
    deity: "Swamimalai Murugan",
    deityShort: "Murugan",
    deityTamil: "முருகனின்",
    place: "Swamimalai",
    lampSrc: `${AKSHANTH_DIR}/lamps.jpg`,
    initialPhotoIndex: 1,
    gift: {
      slug: AKSHANTH_GIFT_SLUG,
      sender: "Anand",
      relation: "Appa",
      birthday: "27 October",
      star: "Rohini",
      templeShort: "Swamimalai",
      tracker: { blessedOn: "27 October" },
    },
    photos: [
      {
        key: "gopuram",
        src: `${AKSHANTH_DIR}/gopuram.jpg`,
        heading: "The temple",
        giftHeading: "Where your blessing was offered",
        line: "Swamimalai Murugan temple, where Akshanth's name was offered.",
        giftLine: "Swamimalai Murugan temple, where your name was offered.",
      },
      {
        key: "gate",
        src: `${AKSHANTH_DIR}/gate.jpg`,
        heading: "The beginning of the offering",
        giftHeading: "The morning begins at Swamimalai",
        line: "We arrived with your blessing in our hands.",
        giftLine: "We arrived with a blessing sent just for you.",
      },
      {
        key: "signboard",
        src: `${AKSHANTH_DIR}/signboard.jpg`,
        heading: "Through the temple gates",
        giftHeading: "Through the temple gates",
        line: "Where every visit to the Lord begins.",
      },
      {
        key: "sankalpam",
        src: `${AKSHANTH_DIR}/sankalpam.jpg`,
        heading: "Akshanth, remembered in prayer",
        giftHeading: "Your name and star, remembered in prayer",
        line: "Akshanth's name and star, written on the card that travels with the prasadam.",
        giftLine: "Your name and star, written on the card that travels with your prasadam.",
      },
      {
        key: "lamps",
        src: `${AKSHANTH_DIR}/lamps.jpg`,
        heading: "A flame for his well-being",
        giftHeading: "A light for your happiness and well-being",
        line: "Flames offered for Akshanth's long and happy life.",
        giftLine: "Flames offered for your long and happy life.",
      },
      {
        key: "offerings",
        src: `${AKSHANTH_DIR}/offerings.jpg`,
        heading: "Flowers and offerings prepared for the Lord",
        giftHeading: "Flowers and offerings prepared for the Lord",
        line: "Flowers, coconut and prasadam, ready to be blessed.",
        giftLine: "Flowers, coconut and prasadam, ready to be blessed for you.",
      },
      {
        key: "flowers",
        src: `${AKSHANTH_DIR}/flowers.jpg`,
        heading: "Fresh flowers for the offering",
        giftHeading: "Fresh flowers for the offering",
        line: "Fresh flowers gathered for Akshanth.",
        giftLine: "Fresh flowers gathered for you.",
      },
      {
        key: "on-the-way",
        src: `${AKSHANTH_DIR}/on-the-way.jpg`,
        heading: "Carrying your wishes inside",
        giftHeading: "Carrying the offering towards the Lord",
        line: "Past the gate, with the offerings in hand.",
      },
      {
        key: "courtyard",
        src: `${AKSHANTH_DIR}/courtyard.jpg`,
        heading: "Within the sacred temple grounds",
        giftHeading: "Within the sacred temple grounds",
        line: "Where devotees gather before the Lord.",
      },
      {
        key: "hall",
        src: `${AKSHANTH_DIR}/hall.jpg`,
        heading: "Along the path to the Lord",
        giftHeading: "Along the path to the Lord",
        line: "The hall that leads to the Lord.",
      },
      {
        key: "corner",
        src: `${AKSHANTH_DIR}/corner.jpg`,
        heading: "A quiet corner",
        giftHeading: "A quiet moment at Swamimalai",
        line: "The temple, as it was that morning.",
      },
    ],
  },
};

export function getVaazhgaReport(slug: string): VaazhgaReport | null {
  return REPORTS[slug] ?? null;
}

/** Looks a report up by the id in its gift page's own link. */
export function getVaazhgaReportByGiftSlug(giftSlug: string): VaazhgaReport | null {
  return Object.values(REPORTS).find((r) => r.gift.slug === giftSlug) ?? null;
}

/** Longest personal message a sender can add. */
export const MAX_MESSAGE_LENGTH = 280;

/**
 * Cleans a personal message that arrives in a gift link: plain text only,
 * control characters removed, blank lines collapsed, capped in length.
 */
export function cleanMessage(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}
