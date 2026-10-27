import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  AKSHANTH_ACT,
  AKSHANTH_ACT_ID,
  AKSHANTH_EVIDENCE,
  AKSHANTH_HERO,
  AKSHANTH_IMPACT_BANNER,
  AKSHANTH_IMPACT_RECORD,
  AKSHANTH_ORGANIZATION,
  AKSHANTH_SNAPSHOT,
  AKSHANTH_TESTIMONIAL,
} from "@/lib/akshanth-raj-content";

const TITLE = AKSHANTH_HERO.title.replace("\n", " ");

export const metadata: Metadata = {
  title: "Vaazhga Vaazhthudan - Akshanth Raj | Aram in Action",
  description: AKSHANTH_HERO.description,
  openGraph: {
    title: TITLE,
    description: AKSHANTH_HERO.description,
    url: "/vaazhga-vaazhthudan/akshanth-raj",
    type: "article",
    images: [{ url: AKSHANTH_HERO.heroImageUrl, width: 1280, height: 720 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: AKSHANTH_HERO.description,
    images: [AKSHANTH_HERO.heroImageUrl],
  },
};

// Public, no-sign-in page for one specific Vaazhga Vaazhthudan act. Same
// composition as /share/annadhanam-for-elders, with this act's own content
// from lib/akshanth-raj-content.ts.
export default function AkshanthRajPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={AKSHANTH_ACT_ID}
        heroImageUrl={AKSHANTH_HERO.heroImageUrl}
        title={AKSHANTH_HERO.title}
        description={AKSHANTH_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={AKSHANTH_HERO.imageObjectPosition}
        highlightWord={AKSHANTH_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={AKSHANTH_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={AKSHANTH_TESTIMONIAL} />
      </div>
      <ActTheAct actId={AKSHANTH_ACT_ID} content={AKSHANTH_ACT} />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={AKSHANTH_ORGANIZATION}
          evidence={AKSHANTH_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={AKSHANTH_IMPACT_RECORD}
        banner={AKSHANTH_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
