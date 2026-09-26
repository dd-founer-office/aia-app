import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { mockKuralOfTheDay } from "@/lib/mock-data";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

// Same Calsans variable font EditorialHero already loads -- the audit's
// h1/h2/h3 roles all name "Calsans" as their family. It has no Tamil
// glyphs, which is why it was skipped for the old Tamil heading; now
// that the heading is English copy, it applies directly.
const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const TEXT = "#062023";
const MUTED = "#788485";
const CARD_BG = "#EAF3F2";

/**
 * Typography below (size/weight/line-height/letter-spacing) starts from
 * the founder's typography-audit reference table (h1/h3/body roles),
 * then several roles diverge per follow-up direction (heading
 * weight up/size down, insights weight +100, card text sized/weighted
 * down, eyebrow letter-spacing tightened) -- see each constant's own
 * comment for the exact deviation. The audited "Calsans" family has no
 * Tamil glyphs, so Tamil-script text keeps font-tamil-sans (Noto Sans
 * Tamil) and only the English reflection copy uses the audited Inter
 * family.
 */

// Eyebrow. Same H3 base as the audit's h3 role; letter-spacing was
// tightened to -2.4px last pass, then eased back +1pt to -1.4px
// (still tighter than the audit's -0.4px, but the -2.4px value
// collapsed the word gaps into an unreadable run-on).
const EYEBROW = {
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: "-1.4px",
  color: TEXT,
} as const;

// Heading. Was the Tamil word "திருக்குறள்" (Thirukkural); now English
// copy, so it renders in Calsans (the audit's own h1/h2/h3 family)
// instead of font-tamil-sans. Weight capped at 700 -- CalSansVF is a
// variable font whose declared range is 400-700, so 700 is the
// heaviest it actually offers (a step up from the previous pass's 800,
// which only "worked" as a browser-synthesized fake bold on top of the
// font's real 700 weight). Size stepped back up toward the audit's
// original h1 spec (clamp max 56px -> 80px). The fluid clamp is no
// longer load-bearing for overflow (English wraps normally at spaces,
// unlike the old single Tamil compound word), but stays for the same
// responsive scaling the rest of the section uses.
const H1 = {
  fontSize: "clamp(32px, 12vw, 80px)",
  fontWeight: 700,
  lineHeight: 1.1,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

const PARAGRAPH = {
  fontSize: "18px",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

// Insights. +100 weight twice over two passes (400 -> 500 -> 600).
const INSIGHT = {
  ...PARAGRAPH,
  fontWeight: 600,
} as const;

// Card text, all sized down and the Kural quote's weight reduced, per
// direction ("reduce the size" / "reduce the weight of the kural"). The
// quote itself renders in font-tamil-serif (Noto Serif Tamil, already
// loaded in layout.tsx but previously unused) rather than the sans
// face everything else in this section uses -- a literary serif for a
// quoted classical couplet, and Unicode Tamil so it renders correctly
// (unlike the legacy non-Unicode "Sai" fonts the founder tried first).
const CARD_QUOTE = {
  fontSize: "15px",
  fontWeight: 500,
  lineHeight: 1.35,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

// Base metadata size +2px extra over two passes (12px -> 14px).
const LABEL = {
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "-0.4px",
} as const;

// The " . " between name/number and between arathuppal/athikaram is a
// divider, not a sentence period -- rendered as a middle dot (which
// sits vertically centered on the line, unlike a period). Both the
// divider and the muted label text now match the bright label text's
// own weight (600) per direction -- label weight itself ("the metadata
// weight") stays at LABEL's base 500 otherwise.
const DIVIDER = {
  fontWeight: 600,
  color: MUTED,
} as const;

const MUTED_TEXT = {
  fontWeight: 600,
  color: MUTED,
} as const;

/**
 * Kural Koorum Aram, full redesign per founder's canvas mockup
 * (2026-09-26): eyebrow, large heading, an English reflection
 * paragraph, two insight lines, and a card holding an actual
 * Thirukkural couplet with its attribution -- replacing the previous
 * teal scroll-formation section and its later testimonial-card pass.
 * Full-bleed white (-mx-5), sitting directly below EditorialHero.
 * Heading/paragraph/insight copy is founder-supplied English text;
 * the card's Kural quote is still mockKuralOfTheDay -- placeholder
 * until the founder supplies the real Kural copy too.
 */
export function KuralKoorumAramSection() {
  return (
    <section className="-mx-5 bg-white px-5 pt-6 pb-8">
      <div className="flex items-center gap-2">
        {/* Nudged up 2px, and faux-bolded by stacking two copies of the
            same mask 0.4px apart -- this is a raster silhouette mask,
            not a stroke-based icon, so there's no real weight axis to
            turn up; overlapping two slightly offset copies thickens
            the apparent stroke instead. */}
        <span
          aria-hidden="true"
          className="relative h-[40px] w-[40px] shrink-0"
          style={{ transform: "translateY(-2px)" }}
        >
          <span
            className="absolute inset-0"
            style={{
              backgroundColor: TEXT,
              WebkitMaskImage: "url(/home/kural-koorum-aram-icon.png)",
              maskImage: "url(/home/kural-koorum-aram-icon.png)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
          <span
            className="absolute inset-0"
            style={{
              backgroundColor: TEXT,
              WebkitMaskImage: "url(/home/kural-koorum-aram-icon.png)",
              maskImage: "url(/home/kural-koorum-aram-icon.png)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              transform: "translate(0.4px, 0.4px)",
            }}
          />
        </span>
        <span className="font-tamil-sans" style={EYEBROW}>
          தமிழ் கூறும் அறம்
        </span>
      </div>

      <h2 className={`${calSans.className} mt-4`} style={H1}>
        You think you&apos;re the story. You&apos;re the alphabet.
      </h2>

      <p className={`${inter.className} mt-4`} style={PARAGRAPH}>
        Everything enduring begins with a foundation. Understanding where we
        begin helps us understand what we are becoming.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <span className={inter.className} style={INSIGHT}>
          We don&apos;t just inherit a story. We become part of what gets
          written next.
        </span>
        <span className={inter.className} style={INSIGHT}>
          What we understand, practice, and live today can become someone
          else&apos;s beginning tomorrow.
        </span>
      </div>

      <div className="mt-6 rounded-2xl p-[18px]" style={{ background: CARD_BG }}>
        <p className="font-tamil-serif" style={CARD_QUOTE}>
          &ldquo;
          {mockKuralOfTheDay.kural_tamil.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
          &rdquo;
        </p>
        <div className="mt-3 flex flex-col gap-1">
          <span className="font-tamil-sans" style={LABEL}>
            <span style={{ fontWeight: 600, color: TEXT }}>திருவள்ளுவர்</span>
            <span style={DIVIDER}> · </span>
            <span style={MUTED_TEXT}>குறள் - 0001</span>
          </span>
          <span className="font-tamil-sans block text-right" style={LABEL}>
            <span style={MUTED_TEXT}>அறத்துப்பால்</span>
            <span style={DIVIDER}> · </span>
            <span style={{ fontWeight: 600, color: TEXT }}>அதிகாரம் - 001</span>
          </span>
        </div>
      </div>
    </section>
  );
}
