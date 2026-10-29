import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  RAINBOW_BREAKFAST_ACT,
  RAINBOW_BREAKFAST_ACT_ID,
  RAINBOW_BREAKFAST_EVIDENCE,
  RAINBOW_BREAKFAST_HERO,
  RAINBOW_BREAKFAST_IMPACT_BANNER,
  RAINBOW_BREAKFAST_IMPACT_RECORD,
  RAINBOW_BREAKFAST_PARTNER,
  RAINBOW_BREAKFAST_SNAPSHOT,
  RAINBOW_BREAKFAST_VIDEO,
} from "@/lib/rainbow-breakfast-content";

const TITLE = RAINBOW_BREAKFAST_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "A morning meal for 20 elders | Aram in Action",
  description: RAINBOW_BREAKFAST_HERO.description,
  openGraph: {
    title: TITLE,
    description: RAINBOW_BREAKFAST_HERO.description,
    url: "/aram/marimuthu-p5w9d3",
    type: "article",
    images: [
      { url: RAINBOW_BREAKFAST_HERO.heroImageUrl, width: 1400, height: 1054 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: RAINBOW_BREAKFAST_HERO.description,
    images: [RAINBOW_BREAKFAST_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the breakfast was given
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/rainbow-breakfast-content.ts.
export default function RainbowBreakfastPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={RAINBOW_BREAKFAST_ACT_ID}
        heroImageUrl={RAINBOW_BREAKFAST_HERO.heroImageUrl}
        title={RAINBOW_BREAKFAST_HERO.title}
        description={RAINBOW_BREAKFAST_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={RAINBOW_BREAKFAST_HERO.imageObjectPosition}
        highlightWord={RAINBOW_BREAKFAST_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={RAINBOW_BREAKFAST_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={RAINBOW_BREAKFAST_VIDEO} />
      </div>
      <ActTheAct
        actId={RAINBOW_BREAKFAST_ACT_ID}
        content={RAINBOW_BREAKFAST_ACT}
      />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={RAINBOW_BREAKFAST_PARTNER}
          evidence={RAINBOW_BREAKFAST_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={RAINBOW_BREAKFAST_IMPACT_RECORD}
        banner={RAINBOW_BREAKFAST_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
