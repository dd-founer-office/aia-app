import type { Metadata } from "next";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import { ContributionImpactRecord } from "@/components/acts/ContributionImpactRecord";
import { ActReflection } from "@/components/acts/ActReflection";
import {
  ANNADHANAM_ELDERS_ACT_ID,
  ANNADHANAM_ELDERS_HERO,
  ANNADHANAM_ELDERS_EVIDENCE,
  ANNADHANAM_ELDERS_IMPACT_RECORD,
} from "@/lib/act-content-overrides";

export const metadata: Metadata = {
  title: "Annadhanam for Elders — Aram in Action",
  description: ANNADHANAM_ELDERS_HERO.description,
  openGraph: {
    title: ANNADHANAM_ELDERS_HERO.title.replace("\n", " "),
    description: ANNADHANAM_ELDERS_HERO.description,
    url: "/share/annadhanam-for-elders",
    type: "article",
    images: [{ url: ANNADHANAM_ELDERS_HERO.heroImageUrl, width: 1040, height: 480 }],
  },
  twitter: {
    card: "summary_large_image",
    title: ANNADHANAM_ELDERS_HERO.title.replace("\n", " "),
    description: ANNADHANAM_ELDERS_HERO.description,
    images: [ANNADHANAM_ELDERS_HERO.heroImageUrl],
  },
};

// A hand-built, public, no-sign-in page for sharing one specific act
// directly (e.g. a WhatsApp link) -- distinct from the real /acts/[id]
// route, which is gated to signed-in contributors actually linked to
// that mission (see app/acts/[id]/page.tsx's own getMyLinkedPublished
// MissionIds() check). Composed from the same real components and the
// same real content override (lib/act-content-overrides.ts) as that
// page -- see this session's own record for why: the operator explicitly
// asked for this exact content, informed that it's a content mockup
// layered over a real mission's id (its own file comment says so) and
// not a literal account of that mission.
export default function AnnadhanamForEldersSharePage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-10 px-5 pb-16 pt-6"
      style={{ background: "#FFFFFF" }}
    >
      <ActDetailHero
        actId={ANNADHANAM_ELDERS_ACT_ID}
        heroImageUrl={ANNADHANAM_ELDERS_HERO.heroImageUrl}
        title={ANNADHANAM_ELDERS_HERO.title}
        description={ANNADHANAM_ELDERS_HERO.description}
        cause="Annadhanam"
        showEyebrow={false}
        imageObjectPosition="96% center"
      />

      {/* Testimonial and Evidence carry their own py-10; -my-10 cancels it
          so every section sits exactly one gap-10 apart. */}
      <div className="-my-10">
        <ActTestimonial />
      </div>

      <ActTheAct actId={ANNADHANAM_ELDERS_ACT_ID} />

      <div className="-my-10">
        <ActEvidence organization={ANNADHANAM_ELDERS_HERO.organization} evidence={ANNADHANAM_ELDERS_EVIDENCE} />
      </div>

      <ContributionImpactRecord data={ANNADHANAM_ELDERS_IMPACT_RECORD} />

      <ActReflection />
    </div>
  );
}
