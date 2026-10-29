import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  RAINBOW_ACT,
  RAINBOW_ACT_ID,
  RAINBOW_EVIDENCE,
  RAINBOW_HERO,
  RAINBOW_IMPACT_BANNER,
  RAINBOW_IMPACT_RECORD,
  RAINBOW_PARTNER,
  RAINBOW_SNAPSHOT,
  RAINBOW_VIDEO,
} from "@/lib/rainbow-content";

const TITLE = RAINBOW_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Because of you | Aram in Action",
  description: RAINBOW_HERO.description,
  openGraph: {
    title: TITLE,
    description: RAINBOW_HERO.description,
    url: "/aram/vignesh-c4m8q2",
    type: "article",
    images: [{ url: RAINBOW_HERO.heroImageUrl, width: 1400, height: 1054 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: RAINBOW_HERO.description,
    images: [RAINBOW_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the breakfast was given
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/rainbow-content.ts.
export default function RainbowPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={RAINBOW_ACT_ID}
        heroImageUrl={RAINBOW_HERO.heroImageUrl}
        title={RAINBOW_HERO.title}
        description={RAINBOW_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={RAINBOW_HERO.imageObjectPosition}
        highlightWord={RAINBOW_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={RAINBOW_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={RAINBOW_VIDEO} />
      </div>
      <ActTheAct actId={RAINBOW_ACT_ID} content={RAINBOW_ACT} />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={RAINBOW_PARTNER}
          evidence={RAINBOW_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={RAINBOW_IMPACT_RECORD}
        banner={RAINBOW_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
