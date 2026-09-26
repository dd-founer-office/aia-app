import { Inter } from "next/font/google";
import { mockKuralOfTheDay } from "@/lib/mock-data";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

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

// Eyebrow. Same H3 base as the audit's h3 role, but letter-spacing
// tightened by a further -2pt (audit's -0.4px -> -2.4px) per direction.
const EYEBROW = {
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: "-2.4px",
  color: TEXT,
} as const;

// Heading. Weight raised from the audit's 600 to the boldest Tamil
// weight this app loads (800), size brought down from the audit's
// literal 80px -- both per direction, and a smaller size only makes
// the single-word overflow problem (see below) easier to avoid.
// "திருக்குறள்" is one compound word with no space to wrap at, so it's
// still a fluid clamp rather than a fixed size, scaled from the same
// ~6.35px-of-width-per-px-of-font-size measurement as before.
const H1 = {
  fontSize: "clamp(28px, 9vw, 56px)",
  fontWeight: 800,
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

// Insights. Same as PARAGRAPH but +100 weight per direction (400 -> 500).
const INSIGHT = {
  ...PARAGRAPH,
  fontWeight: 500,
} as const;

// Card text, all sized down and the Kural quote's weight reduced, per
// direction ("reduce the size" / "reduce the weight of the kural").
const CARD_QUOTE = {
  fontSize: "15px",
  fontWeight: 500,
  lineHeight: 1.35,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

const LABEL = {
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "-0.4px",
} as const;

// The " . " between name/number and between arathuppal/athikaram is a
// divider, not a sentence period -- rendered as a middle dot (which
// sits vertically centered on the line, unlike a period) at a heavier
// weight than the label text around it, per direction. Label weight
// itself ("the metadata weight") is left as it was.
const DIVIDER = {
  fontWeight: 700,
  color: MUTED,
} as const;

/**
 * Kural Koorum Aram, full redesign per founder's canvas mockup
 * (2026-09-26): eyebrow, large heading, an English reflection
 * paragraph, two insight lines, and a card holding an actual
 * Thirukkural couplet with its attribution -- replacing the previous
 * teal scroll-formation section and its later testimonial-card pass.
 * Full-bleed white (-mx-5), sitting directly below EditorialHero.
 * Content is still mockKuralOfTheDay -- placeholder until the founder
 * supplies the real copy.
 */
export function KuralKoorumAramSection() {
  return (
    <section className="-mx-5 bg-white px-5 pt-6 pb-8">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-6 w-6 shrink-0"
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
        <span className="font-tamil-sans" style={EYEBROW}>
          தமிழ் கூறும் அறம்
        </span>
      </div>

      <h2 className="font-tamil-sans mt-4" style={H1}>
        திருக்குறள்
      </h2>

      <p className={`${inter.className} mt-4`} style={PARAGRAPH}>
        Every enduring system begins with a foundation. True understanding
        starts by recognizing and respecting that foundation.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <span className={inter.className} style={INSIGHT}>
          Every meaningful journey becomes stronger when we understand where
          we come from.
        </span>
        <span className={inter.className} style={INSIGHT}>
          Knowing our roots gives purpose to our future.
        </span>
      </div>

      <div className="mt-6 rounded-2xl p-[18px]" style={{ background: CARD_BG }}>
        <p className="font-tamil-sans" style={CARD_QUOTE}>
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
            <span style={{ color: MUTED }}>குறள் - 0001</span>
          </span>
          <span className="font-tamil-sans block text-right" style={LABEL}>
            <span style={{ color: MUTED }}>அறத்துப்பால்</span>
            <span style={DIVIDER}> · </span>
            <span style={{ fontWeight: 600, color: TEXT }}>அதிகாரம் -001</span>
          </span>
        </div>
      </div>
    </section>
  );
}
