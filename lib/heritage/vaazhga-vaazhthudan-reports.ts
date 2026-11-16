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
  birthday: string;
  star: string;
  /** Short temple name for the fact card. */
  templeShort: string;
  tracker: Tracker;
  /** Opening clip. Until it exists the opener shows the poster photo. */
  videoSrc?: string;
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
  /** Opening photo for the lamp section and the gift preview. */
  lampSrc: string;
  /** The swipe row, in order. */
  photos: ReportPhoto[];
  /** Index of the photo centred when the row first appears. */
  initialPhotoIndex: number;
  /** The page the recipient sees, reached from the report's send button. */
  gift: Gift;
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

const REPORTS: Record<string, VaazhgaReport> = {
  [AKSHANTH_SLUG]: {
    slug: AKSHANTH_SLUG,
    recipient: "Akshanth",
    pronouns: { subject: "he", object: "him", possessive: "his" },
    deity: "Swamimalai Murugan",
    lampSrc: `${AKSHANTH_DIR}/lamps.jpg`,
    initialPhotoIndex: 1,
    gift: {
      slug: AKSHANTH_GIFT_SLUG,
      sender: "Rajesh",
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
        line: "Swamimalai Murugan temple, where Akshanth's name was offered.",
        giftLine: "Swamimalai Murugan temple, where your name was offered.",
      },
      {
        key: "gate",
        src: `${AKSHANTH_DIR}/gate.jpg`,
        heading: "At the gate",
        line: "We arrived with your blessing in our hands.",
        giftLine: "We arrived with a blessing sent just for you.",
      },
      {
        key: "signboard",
        src: `${AKSHANTH_DIR}/signboard.jpg`,
        heading: "The entrance",
        line: "Where every visit to the Lord begins.",
      },
      {
        key: "sankalpam",
        src: `${AKSHANTH_DIR}/sankalpam.jpg`,
        heading: "The sankalpam",
        line: "Akshanth's name and star, written on the card that travels with the prasadam.",
        giftLine: "Your name and star, written on the card that travels with your prasadam.",
      },
      {
        key: "lamps",
        src: `${AKSHANTH_DIR}/lamps.jpg`,
        heading: "The lamps",
        line: "Flames offered for Akshanth's long and happy life.",
        giftLine: "Flames offered for your long and happy life.",
      },
      {
        key: "offerings",
        src: `${AKSHANTH_DIR}/offerings.jpg`,
        heading: "The offerings",
        line: "Flowers, coconut and prasadam, ready to be blessed.",
        giftLine: "Flowers, coconut and prasadam, ready to be blessed for you.",
      },
      {
        key: "flowers",
        src: `${AKSHANTH_DIR}/flowers.jpg`,
        heading: "The flowers",
        line: "Fresh flowers gathered for Akshanth.",
        giftLine: "Fresh flowers gathered for you.",
      },
      {
        key: "on-the-way",
        src: `${AKSHANTH_DIR}/on-the-way.jpg`,
        heading: "On the way in",
        line: "Past the gate, with the offerings in hand.",
      },
      {
        key: "courtyard",
        src: `${AKSHANTH_DIR}/courtyard.jpg`,
        heading: "The courtyard",
        line: "Where devotees gather before the Lord.",
      },
      {
        key: "hall",
        src: `${AKSHANTH_DIR}/hall.jpg`,
        heading: "The pillared hall",
        line: "The hall that leads to the Lord.",
      },
      {
        key: "corner",
        src: `${AKSHANTH_DIR}/corner.jpg`,
        heading: "A quiet corner",
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
