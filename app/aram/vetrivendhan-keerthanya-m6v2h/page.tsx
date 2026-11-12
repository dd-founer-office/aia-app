import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  RAINBOW_LUNCH_ACT,
  RAINBOW_LUNCH_ACT_ID,
  RAINBOW_LUNCH_EVIDENCE,
  RAINBOW_LUNCH_HERO,
  RAINBOW_LUNCH_IMPACT_BANNER,
  RAINBOW_LUNCH_IMPACT_RECORD,
  RAINBOW_LUNCH_PARTNER,
  RAINBOW_LUNCH_SNAPSHOT,
  RAINBOW_LUNCH_VIDEO,
} from "@/lib/rainbow-lunch-content";

const TITLE = RAINBOW_LUNCH_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Lunch for 20 elders | Aram in Action",
  description: RAINBOW_LUNCH_HERO.description,
  openGraph: {
    title: TITLE,
    description: RAINBOW_LUNCH_HERO.description,
    url: "/aram/vetrivendhan-keerthanya-m6v2h",
    type: "article",
    images: [
      { url: RAINBOW_LUNCH_HERO.heroImageUrl, width: 1400, height: 1054 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: RAINBOW_LUNCH_HERO.description,
    images: [RAINBOW_LUNCH_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the lunch was given
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/rainbow-lunch-content.ts.
export default function RainbowLunchPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={RAINBOW_LUNCH_ACT_ID}
        heroImageUrl={RAINBOW_LUNCH_HERO.heroImageUrl}
        title={RAINBOW_LUNCH_HERO.title}
        description={RAINBOW_LUNCH_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={RAINBOW_LUNCH_HERO.imageObjectPosition}
        highlightWord={RAINBOW_LUNCH_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={RAINBOW_LUNCH_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={RAINBOW_LUNCH_VIDEO} />
      </div>
      <ActTheAct actId={RAINBOW_LUNCH_ACT_ID} content={RAINBOW_LUNCH_ACT} />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={RAINBOW_LUNCH_PARTNER}
          evidence={RAINBOW_LUNCH_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={RAINBOW_LUNCH_IMPACT_RECORD}
        banner={RAINBOW_LUNCH_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
