import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  ARIHANT_ACT,
  ARIHANT_ACT_ID,
  ARIHANT_EVIDENCE,
  ARIHANT_HERO,
  ARIHANT_IMPACT_BANNER,
  ARIHANT_IMPACT_RECORD,
  ARIHANT_ORGANIZATION,
  ARIHANT_SNAPSHOT,
  ARIHANT_TESTIMONIAL,
} from "@/lib/arihant-content";

const TITLE = ARIHANT_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "A birthday lunch for 35 residents | Aram in Action",
  description: ARIHANT_HERO.description,
  openGraph: {
    title: TITLE,
    description: ARIHANT_HERO.description,
    url: "/vaazhga-vaazhthudan/arihant-r4k8w2",
    type: "article",
    images: [{ url: ARIHANT_HERO.heroImageUrl, width: 1400, height: 787 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: ARIHANT_HERO.description,
    images: [ARIHANT_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the lunch was booked
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/arihant-content.ts.
export default function ArihantPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={ARIHANT_ACT_ID}
        heroImageUrl={ARIHANT_HERO.heroImageUrl}
        title={ARIHANT_HERO.title}
        description={ARIHANT_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={ARIHANT_HERO.imageObjectPosition}
        highlightWord={ARIHANT_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={ARIHANT_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={ARIHANT_TESTIMONIAL} />
      </div>
      <ActTheAct actId={ARIHANT_ACT_ID} content={ARIHANT_ACT} />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={ARIHANT_ORGANIZATION}
          evidence={ARIHANT_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={ARIHANT_IMPACT_RECORD}
        banner={ARIHANT_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
