"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrayingHandsIcon } from "@/components/home/icons/PrayingHandsIcon";
import { mockLatestAct, mockKuralOfTheDay } from "@/lib/mock-data";
import { STAGE_LABELS, STAGE_ORDER } from "@/types";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { JourneyTimeline } from "@/components/home/JourneyTimeline";
import { onLivingFieldEngineReady } from "@/lib/living-field/engine-registry";
import { notifyEvent } from "@/lib/ambient-language/ambient-language";
import KuralScrollFormation from "@/components/home/KuralScrollFormation";
import type { CurrentContributor } from "@/lib/contributor";

export function HomeClient({ contributor }: { contributor: CurrentContributor }) {
  const router = useRouter();
  const stageIndex = STAGE_ORDER.indexOf(contributor.currentStage);
  const nextStageName = STAGE_ORDER[stageIndex + 1];
  const nextStage = nextStageName ? STAGE_LABELS[nextStageName] : null;

  const hasParticipatedThisMonth = contributor.hasParticipatedThisMonth;

  // Ambient Language Layer: fire "homeReady" exactly once per real mount.
  //
  // `firedRef` (not state -- this never needs to trigger a re-render) is
  // what makes this safe under React 18 Strict Mode's development-only
  // double-invoke of effects. Strict Mode mounts, runs this effect, runs
  // its cleanup, then runs the effect again on the SAME component
  // instance -- refs survive that cycle, state along with them would too,
  // but a ref is the correct minimal tool since nothing here needs to
  // render differently. Walked through both orderings this needs to
  // handle correctly:
  //
  //   Engine already registered when this effect first runs:
  //     onLivingFieldEngineReady() calls back synchronously -> firedRef
  //     flips to true and notifyEvent fires immediately. Strict Mode's
  //     cleanup then runs (a no-op, since the callback already fired --
  //     nothing was left pending to unsubscribe). The second effect
  //     invocation checks firedRef, sees true, and returns immediately
  //     without subscribing again. No duplicate.
  //
  //   Engine not yet registered when this effect first runs:
  //     The callback is queued (see engine-registry.ts), not fired.
  //     Strict Mode's cleanup unsubscribes that still-pending callback
  //     before it can ever fire. The second effect invocation subscribes
  //     fresh -- this is the ONE standing subscription that will actually
  //     fire, once, whenever the engine does register. No duplicate, and
  //     nothing is lost regardless of which order Home's effect and the
  //     Living Field's own registration effect happen to run in -- that's
  //     the entire reason onLivingFieldEngineReady is callback-based
  //     rather than a single synchronous check.
  //
  // No timer, no polling, no setTimeout anywhere in this mechanism.
  const homeReadyFiredRef = useRef(false);

  useEffect(() => {
    if (homeReadyFiredRef.current) return;

    const unsubscribe = onLivingFieldEngineReady(() => {
      if (homeReadyFiredRef.current) return;
      homeReadyFiredRef.current = true;
      notifyEvent("homeReady");
    });

    return unsubscribe;
  }, []);

  // Living Literature Prelude: let the field recognize "அறம்" -- the theme
  // Kural Koorum Aram represents -- shortly BEFORE the Kural Scroll
  // Formation actually reaches the user's reading position at the footer.
  //
  // IntersectionObserver, not scroll-position polling or a timer, is the
  // clean lifecycle tool for "notify me when this element is about to
  // enter view": it's the browser's own purpose-built primitive for
  // exactly this question, event-driven rather than polled, and it costs
  // nothing while the user hasn't scrolled anywhere near the section yet.
  //
  // `rootMargin`'s bottom value is set to a generous positive number,
  // which -- per the spec's own semantics -- EXPANDS the effective
  // viewport downward before intersection is tested. The practical effect:
  // the observer fires while the section is still comfortably below
  // the visible viewport, not when it's actually on screen.
  //
  // This is inherently a best-effort, typical-case timing choice, not a
  // hard guarantee -- an unusually fast scroll could reach the footer
  // before the recognition fully dissolves. That's consistent with the
  // Ambient Language Layer's existing philosophy everywhere else
  // (best-effort matching, no forced outcomes) rather than a gap specific
  // to this integration.
  //
  // Same Strict-Mode-safe idempotency pattern as the homeReady trigger
  // above: a ref guard, and the observer is disconnected in cleanup (both
  // on real unmount and once it has fired) so it can never trigger twice.
  const kuralSectionRef = useRef<HTMLDivElement | null>(null);
  const kuralRecognitionFiredRef = useRef(false);

  useEffect(() => {
    const target = kuralSectionRef.current;
    if (!target || kuralRecognitionFiredRef.current) return;

    // Holds the onLivingFieldEngineReady unsubscribe function, if/once one
    // exists -- so effect cleanup can cancel EITHER the IntersectionObserver
    // (if it hasn't fired yet) OR the still-pending engine-ready
    // subscription (if intersection already fired but the engine hadn't
    // registered yet), never leaking a callback for either reason.
    let engineReadyUnsubscribe: (() => void) | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (kuralRecognitionFiredRef.current) return;

        engineReadyUnsubscribe = onLivingFieldEngineReady(() => {
          if (kuralRecognitionFiredRef.current) return;
          kuralRecognitionFiredRef.current = true;
          notifyEvent("kuralSection", { phrase: "அறம்" });
        });
        // The section only ever needs to trigger once -- tear down the
        // observer immediately rather than waiting for the effect's own
        // cleanup, so scrolling past and back never re-triggers it.
        observer.disconnect();
      },
      { rootMargin: "0px 0px 600px 0px" }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      engineReadyUnsubscribe?.();
    };
  }, []);

  return (
    // NOTE: bg-[var(--color-background)] intentionally removed from this
    // root wrapper. body already carries this exact background color
    // (globals.css), so this class was a redundant duplicate paint that
    // silently sat on top of the Living Field's ambient canvas (which
    // lives at z-index:-10, painted before body's own background). No
    // visual change from this removal on its own -- body's background
    // shows through identically. This is the only line changed in this file.
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-28 pt-10">
        {/* Hero */}
        <section className="flex flex-col gap-1">
          <div className="flex items-start gap-3">
            <PrayingHandsIcon
              className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              style={{ height: "64px", width: "auto" }}
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                <span className="font-tamil-sans font-medium">
                  {"வணக்கம்"}
                </span>
                ,
                <br />
                {contributor.displayName}
              </h1>
              <p className="font-tamil-sans font-normal mt-1.5 text-sm text-[var(--color-muted-foreground)]">
                {"அறம் செய பழகு"}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <JourneyTimeline currentStage={contributor.currentStage} />
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            You&apos;ve shown up for {contributor.continuityMonthCount} months in a row.
            {nextStage ? ` Keep going to grow toward ${nextStage.en}.` : ""}
          </p>
          {/* CA-009 Hero Card's own locked requirements (Lifetime Acts,
              View Journey CTA) -- the JourneyTimeline above already covers
              Current Stage/Continuity richer than the spec's minimal
              version, so this only adds what's still missing rather than
              duplicating it in a separate compact Journey Snapshot section
              further down the page (founder direction, 2026-09-16). */}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Lifetime Acts: <span className="font-medium text-[var(--color-foreground)]">{contributor.lifetimeParticipationCount}</span>
            </p>
            <Link href="/practice">
              <Button variant="text">View Journey →</Button>
            </Link>
          </div>
        </section>

        {/* Next Action */}
        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-lg font-semibold leading-snug">
              {hasParticipatedThisMonth
                ? "You're continuing to show up."
                : "Your next Act of Aram is waiting."}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {hasParticipatedThisMonth
                ? "Your next opportunity to practice Aram will appear here soon."
                : "Continue your journey by participating in an Act of Aram this month."}
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => router.push("/participate/causes")}
          >
            Begin Your Next Act
          </Button>
        </Card>

        {/* Recent Impact (CA-009 Section 3) -- CA-009's own spec note: "the
            section title is 'Recent Impact' for comprehension; the card
            itself may still label 'Act of Aram'" -- title corrected to
            match (was "Your Latest Act of Aram"), card content unchanged.
            mockLatestAct is temporary presentation-only mock data (see
            lib/mock-data.ts); Act of Aram is not a table in the locked
            Sprint 1 schema. Swap the ternary's truthy branch for a live
            query when the real entity ships -- the empty-state branch is
            left in place for that day. */}
        <Card className="flex flex-col gap-4">
          <SectionHeader title="Recent Impact" />
          {mockLatestAct ? (
            <>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mockLatestAct.hero_image_url}
                  alt={`${mockLatestAct.cause} Act of Aram`}
                  className="h-[260px] w-full rounded-[var(--radius-photo)] object-cover"
                />
                <span
                  className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                >
                  <MapPin size={12} />
                  {mockLatestAct.location}
                  <span className="opacity-70">·</span>
                  {mockLatestAct.completed_date}
                </span>
              </div>
              <p className="text-lg font-semibold leading-snug">{mockLatestAct.cause}</p>
              <div className="flex flex-wrap gap-2">
                <Badge status="verified" label="Verified" />
                <Badge status="verified" label="Executed" />
                <Badge status="verified" label="Documented" />
              </div>
              <p className="text-sm text-[var(--color-foreground)]">
                {mockLatestAct.impact_summary}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {mockLatestAct.completed_date}
                </p>
                <Button variant="text">View Act →</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-skeleton)]">
                <span className="text-sm text-[var(--color-muted-foreground)]">No image yet</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-base font-medium">
                  Your first verified Act of Aram will appear here.
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Once your first Act is completed, you&apos;ll see photos, impact details and
                  verification here.
                </p>
              </div>
              <Button variant="text" className="self-start">
                Begin an Act of Aram
              </Button>
            </>
          )}
        </Card>

        {/* Shared Act of Aram (CA-009 Section 4, conditional). Locked rule:
            "Only shown if Shared Act exists" / "Hide section" otherwise --
            no Shared Act entity exists in the Sprint 1 schema at all yet,
            so this always hides for now (previously showed an explanatory
            empty-state card, which the locked spec doesn't call for on
            this section specifically -- unlike Opportunity for Aram below,
            whose own spec explicitly wants an awareness-only empty state).
            Re-add the render once a real Shared Act entity exists. */}

        {/* Opportunity for Aram (CA-009 Section 6). Awareness only, not
            fundraising (locked rule). No Opportunity entity exists yet
            (Opportunity Management is Milestone 4, Operations Foundation,
            not built) -- same status as Recent Impact above before its own
            entity ships, so this renders the locked empty state. */}
        <Card className="flex flex-col gap-2">
          <SectionHeader title="Opportunity for Aram" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Verified opportunities will appear here.
          </p>
        </Card>

        {/* Kural Koorum Aram -- heading, Kural Scroll Formation, and
            reflection text, all now living here in full (supersedes
            Sprint 04A Living Region entirely, founder-directed). The
            heading + reflection text (core_principle, aram_for_today_body)
            were previously duplicated inline on every single Act of Aram
            detail page -- moved here completely, this section's one home,
            rather than existing in two places. This wrapping div still
            carries kuralSectionRef (unchanged -- the ambient
            recognition-pulse IntersectionObserver above still needs a real
            DOM target to watch), now spanning the whole section rather than
            just the formation box. KuralScrollFormation itself is fully
            isolated from lib/living-field/ (see its own file header for
            why) -- it spawns and animates its own KKA-001 letters,
            converging as the page scrolls toward this point, holding
            briefly as real text, then dissolving back into ambient
            scatter; the verse text lives only there, not repeated below. */}
        <div ref={kuralSectionRef} className="flex flex-col gap-4">
          <p className="font-tamil-sans font-medium text-sm">குறள் கூறும் அறம்</p>
          <KuralScrollFormation />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {mockKuralOfTheDay.core_principle}
          </p>
          <p className="text-sm italic leading-relaxed">{mockKuralOfTheDay.aram_for_today_body}</p>
        </div>
      </main>

      <BottomNavigation active="home" />
    </div>
  );
}
