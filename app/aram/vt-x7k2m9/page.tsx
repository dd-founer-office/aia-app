import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import { TestimonialFadeOut } from "@/components/acts/TestimonialFadeOut";
import {
  VOICE_TRUST_ACT,
  VOICE_TRUST_ACT_ID,
  VOICE_TRUST_EVIDENCE,
  VOICE_TRUST_HERO,
  VOICE_TRUST_IMPACT_BANNER,
  VOICE_TRUST_IMPACT_RECORD,
  VOICE_TRUST_PARTNER,
  VOICE_TRUST_SNAPSHOT,
  VOICE_TRUST_VIDEO,
} from "@/lib/voice-trust-content";

const TITLE = VOICE_TRUST_HERO.title.replace("\n", " ");

// A private page for one person: the address carries an id, and search
// engines are asked not to list it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "A breakfast, because of you | Aram in Action",
  description: VOICE_TRUST_HERO.description,
  openGraph: {
    title: TITLE,
    description: VOICE_TRUST_HERO.description,
    url: "/aram/vt-x7k2m9",
    type: "article",
    images: [{ url: VOICE_TRUST_HERO.heroImageUrl, width: 1204, height: 1600 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: VOICE_TRUST_HERO.description,
    images: [VOICE_TRUST_HERO.heroImageUrl],
  },
};

// No-sign-in page shared directly with the person the breakfast was given
// for. Same composition as /share/annadhanam-for-elders, with this act's own
// content from lib/voice-trust-content.ts.
export default function VoiceTrustPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={VOICE_TRUST_ACT_ID}
        heroImageUrl={VOICE_TRUST_HERO.heroImageUrl}
        title={VOICE_TRUST_HERO.title}
        description={VOICE_TRUST_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition={VOICE_TRUST_HERO.imageObjectPosition}
        highlightWord={VOICE_TRUST_HERO.highlightWord}
        ctaLabel="Your Aram in Action"
        snapshotContent={VOICE_TRUST_SNAPSHOT}
      />

      <div className="-my-10">
        <ActTestimonial content={VOICE_TRUST_VIDEO} />
      </div>
      <ActTheAct actId={VOICE_TRUST_ACT_ID} content={VOICE_TRUST_ACT} />
      <TestimonialFadeOut />

      <div className="-my-10">
        <ActEvidence
          organization={VOICE_TRUST_PARTNER}
          evidence={VOICE_TRUST_EVIDENCE}
        />
      </div>

      <ContributionImpactRecord
        data={VOICE_TRUST_IMPACT_RECORD}
        banner={VOICE_TRUST_IMPACT_BANNER}
      />

      <ActReflection />
    </div>
  );
}
