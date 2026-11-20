import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  MARIMUTHU_SCHOOL_ACT,
  MARIMUTHU_SCHOOL_ACT_ID,
  MARIMUTHU_SCHOOL_EVIDENCE,
  MARIMUTHU_SCHOOL_HERO,
  MARIMUTHU_SCHOOL_IMPACT_BANNER,
  MARIMUTHU_SCHOOL_IMPACT_RECORD,
  MARIMUTHU_SCHOOL_PARTNER,
  MARIMUTHU_SCHOOL_SNAPSHOT,
  MARIMUTHU_SCHOOL_VIDEO,
} from "@/lib/school-supplies-content";

const TITLE = MARIMUTHU_SCHOOL_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "A school year, supplied | Aram in Action",
  description: MARIMUTHU_SCHOOL_HERO.description,
  openGraph: {
    title: TITLE,
    description: MARIMUTHU_SCHOOL_HERO.description,
    url: "/aram/marimuthu-s8q4n2",
    type: "article",
    images: [
      { url: MARIMUTHU_SCHOOL_HERO.heroImageUrl, width: 1400, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: MARIMUTHU_SCHOOL_HERO.description,
    images: [MARIMUTHU_SCHOOL_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the school supplies were given
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/school-supplies-content.ts.
export default function MARIMUTHUSchoolPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={MARIMUTHU_SCHOOL_ACT_ID}
        heroImageUrl={MARIMUTHU_SCHOOL_HERO.heroImageUrl}
        title={MARIMUTHU_SCHOOL_HERO.title}
        description={MARIMUTHU_SCHOOL_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={MARIMUTHU_SCHOOL_HERO.imageObjectPosition}
        highlightWord={MARIMUTHU_SCHOOL_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={MARIMUTHU_SCHOOL_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={MARIMUTHU_SCHOOL_VIDEO} />
      </div>
      <ActTheAct
        actId={MARIMUTHU_SCHOOL_ACT_ID}
        content={MARIMUTHU_SCHOOL_ACT}
      />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={MARIMUTHU_SCHOOL_PARTNER}
          evidence={MARIMUTHU_SCHOOL_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={MARIMUTHU_SCHOOL_IMPACT_RECORD}
        banner={MARIMUTHU_SCHOOL_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
