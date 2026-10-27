import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  TREE_BIRTHDAY_ACT,
  TREE_BIRTHDAY_ACT_ID,
  TREE_BIRTHDAY_EVIDENCE,
  TREE_BIRTHDAY_HERO,
  TREE_BIRTHDAY_IMPACT_BANNER,
  TREE_BIRTHDAY_IMPACT_RECORD,
  TREE_BIRTHDAY_PARTNER,
  TREE_BIRTHDAY_SNAPSHOT,
  TREE_BIRTHDAY_VIDEO,
} from "@/lib/akshanth-raj-tree-planting-content";

const TITLE = TREE_BIRTHDAY_HERO.title.replace("\n", " ");

export const metadata: Metadata = {
  title: "Vaazhga Vaazhthudan - Akshanth Raj Tree Planting | Aram in Action",
  description: TREE_BIRTHDAY_HERO.description,
  openGraph: {
    title: TITLE,
    description: TREE_BIRTHDAY_HERO.description,
    url: "/vaazhga-vaazhthudan/akshanth-raj-tree-planting",
    type: "article",
    images: [
      { url: TREE_BIRTHDAY_HERO.heroImageUrl, width: 576, height: 1280 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: TREE_BIRTHDAY_HERO.description,
    images: [TREE_BIRTHDAY_HERO.heroImageUrl],
  },
};

// Public, no-sign-in page for one specific Vaazhga Vaazhthudan act. Same
// composition as /share/annadhanam-for-elders, with this act's own content
// from lib/akshanth-raj-content.ts.
export default function AkshanthRajTreePlantingPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={TREE_BIRTHDAY_ACT_ID}
        heroImageUrl={TREE_BIRTHDAY_HERO.heroImageUrl}
        title={TREE_BIRTHDAY_HERO.title}
        description={TREE_BIRTHDAY_HERO.description}
        cause="Tree planting"
        showEyebrow={false}
        imageObjectPosition={TREE_BIRTHDAY_HERO.imageObjectPosition}
        highlightWord={TREE_BIRTHDAY_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={TREE_BIRTHDAY_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={TREE_BIRTHDAY_VIDEO} />
      </div>
      <ActTheAct actId={TREE_BIRTHDAY_ACT_ID} content={TREE_BIRTHDAY_ACT} />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={TREE_BIRTHDAY_PARTNER}
          evidence={TREE_BIRTHDAY_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={TREE_BIRTHDAY_IMPACT_RECORD}
        banner={TREE_BIRTHDAY_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
