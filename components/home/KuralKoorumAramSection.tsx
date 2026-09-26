import { Inter } from "next/font/google";
import { mockKuralOfTheDay } from "@/lib/mock-data";

const inter = Inter({ subsets: ["latin"], weight: ["400"], display: "swap" });

const TEXT = "#062023";
const MUTED = "#8A8678";
const CARD_BG = "#EAF3F2";

/**
 * Typography below (size/weight/line-height/letter-spacing) comes
 * directly from the founder's typography-audit reference table
 * (h1/h3/body roles). The audited family, "Calsans", has no Tamil
 * glyphs, so Tamil-script text keeps font-tamil-sans (Noto Sans Tamil)
 * and only the English reflection copy uses the audited Inter family;
 * the numeric spec is followed exactly either way.
 */
// 80px is the audited spec's literal size, but "திருக்குறள்" is a single
// compound word with no space to wrap at -- at a fixed 80px it measures
// ~508px wide and runs off a 390px phone screen instead of wrapping.
// Scaled fluidly against the viewport (measured: 507.9px wide at 80px,
// so ~6.35px of width per px of font-size) so it always fits inside the
// section's 20px side padding, reaching the literal 80px only at/above
// a 600px-wide viewport.
const H1 = {
  fontSize: "clamp(36px, 13.33vw, 80px)",
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

const H3 = {
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

const BODY = {
  fontSize: "18px",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "-0.4px",
  color: TEXT,
} as const;

const LABEL = {
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "-0.4px",
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
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
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
        <span className="font-tamil-sans" style={H3}>
          தமிழ் கூறும் அறம்
        </span>
      </div>

      <h2 className="font-tamil-sans mt-4" style={H1}>
        திருக்குறள்
      </h2>

      <p className={`${inter.className} mt-4`} style={BODY}>
        Every enduring system begins with a foundation. True understanding
        starts by recognizing and respecting that foundation.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <span className={inter.className} style={BODY}>
          Every meaningful journey becomes stronger when we understand where
          we come from.
        </span>
        <span className={inter.className} style={BODY}>
          Knowing our roots gives purpose to our future.
        </span>
      </div>

      <div className="mt-6 rounded-2xl p-[18px]" style={{ background: CARD_BG }}>
        <p className="font-tamil-sans" style={H3}>
          {mockKuralOfTheDay.kural_tamil.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </p>
        <div className="mt-3 flex flex-col gap-1">
          <span className="font-tamil-sans" style={LABEL}>
            <span style={{ fontWeight: 600, color: TEXT }}>திருவள்ளுவர்</span>
            <span style={{ color: MUTED }}> . குறள் - 0001</span>
          </span>
          <span className="font-tamil-sans block text-right" style={LABEL}>
            <span style={{ color: MUTED }}>அறத்துப்பால்</span>
            <span style={{ fontWeight: 600, color: TEXT }}> . அதிகாரம் -001</span>
          </span>
        </div>
      </div>
    </section>
  );
}
