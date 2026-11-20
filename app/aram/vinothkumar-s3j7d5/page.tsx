import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  VINOTHKUMAR_SCHOOL_ACT,
  VINOTHKUMAR_SCHOOL_ACT_ID,
  VINOTHKUMAR_SCHOOL_EVIDENCE,
  VINOTHKUMAR_SCHOOL_HERO,
  VINOTHKUMAR_SCHOOL_IMPACT_BANNER,
  VINOTHKUMAR_SCHOOL_IMPACT_RECORD,
  VINOTHKUMAR_SCHOOL_PARTNER,
  VINOTHKUMAR_SCHOOL_SNAPSHOT,
  VINOTHKUMAR_SCHOOL_VIDEO,
} from "@/lib/school-supplies-content";

const TITLE = VINOTHKUMAR_SCHOOL_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "A school year, supplied | Aram in Action",
  description: VINOTHKUMAR_SCHOOL_HERO.description,
  openGraph: {
    title: TITLE,
    description: VINOTHKUMAR_SCHOOL_HERO.description,
    url: "/aram/vinothkumar-s3j7d5",
    type: "article",
    images: [
      { url: VINOTHKUMAR_SCHOOL_HERO.heroImageUrl, width: 1400, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: VINOTHKUMAR_SCHOOL_HERO.description,
    images: [VINOTHKUMAR_SCHOOL_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the school supplies were given
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/school-supplies-content.ts.
export default function VINOTHKUMARSchoolPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={VINOTHKUMAR_SCHOOL_ACT_ID}
        heroImageUrl={VINOTHKUMAR_SCHOOL_HERO.heroImageUrl}
        title={VINOTHKUMAR_SCHOOL_HERO.title}
        description={VINOTHKUMAR_SCHOOL_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={VINOTHKUMAR_SCHOOL_HERO.imageObjectPosition}
        highlightWord={VINOTHKUMAR_SCHOOL_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={VINOTHKUMAR_SCHOOL_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={VINOTHKUMAR_SCHOOL_VIDEO} />
      </div>
      <ActTheAct
        actId={VINOTHKUMAR_SCHOOL_ACT_ID}
        content={VINOTHKUMAR_SCHOOL_ACT}
      />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={VINOTHKUMAR_SCHOOL_PARTNER}
          evidence={VINOTHKUMAR_SCHOOL_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={VINOTHKUMAR_SCHOOL_IMPACT_RECORD}
        banner={VINOTHKUMAR_SCHOOL_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
