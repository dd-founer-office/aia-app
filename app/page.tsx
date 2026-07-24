"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { PrayingHandsIcon } from "@/components/home/icons/PrayingHandsIcon";
import {
  mockContributor,
  mockJourney,
  mockLatestAct,
  mockKuralOfTheDay,
  getCurrentMonthParticipation,
} from "@/lib/mock-data";
import { STAGE_LABELS, STAGE_ORDER } from "@/types";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { JourneyTimeline } from "@/components/home/JourneyTimeline";
import { onLivingFieldEngineReady } from "@/lib/living-field/engine-registry";
import { notifyEvent } from "@/lib/ambient-language/ambient-language";
import LivingRegionZone from "@/components/field/LivingRegionZone";

export default function HomePage() {
  const router = useRouter();
  const stageIndex = STAGE_ORDER.indexOf(mockJourney.current_stage);
  const nextStageName = STAGE_ORDER[stageIndex + 1];
  const nextStage = nextStageName ? STAGE_LABELS[nextStageName] : null;

  const currentParticipation = getCurrentMonthParticipation();
  const hasParticipatedThisMonth = currentParticipation?.status === "completed";

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
  // Kural Koorum Aram represents, not the specific day's verse text, which
  // still comes only from mockKuralOfTheDay exactly as before -- shortly
  // BEFORE the Kural card actually reaches the user's reading position.
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
  // the observer fires while the Kural card is still comfortably below
  // the visible viewport, not when it's actually on screen. Given the
  // Kernel's expression cycle is 11 seconds total (3s rise, 4s hold, 4s
  // fall) and ordinary scroll speed, this gives the recognition a real
  // head start -- typically enough for it to have visibly settled by the
  // time the card is actually where the user is reading, without ever
  // literally gating or delaying the card's render (the card is always
  // present in the DOM; only the FIELD's timing creates the sequence).
  //
  // This is inherently a best-effort, typical-case timing choice, not a
  // hard guarantee -- an unusually fast scroll could reach the card before
  // the recognition fully dissolves. That's consistent with the Ambient
  // Language Layer's existing philosophy everywhere else (best-effort
  // matching, no forced outcomes) rather than a gap specific to this
  // integration.
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
                  {"\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD"}
                </span>
                ,
                <br />
                {mockContributor.display_name}
              </h1>
              <p className="font-tamil-sans font-normal mt-1.5 text-sm text-[var(--color-muted-foreground)]">
                {"\u0B85\u0BB1\u0BAE\u0BCD \u0B9A\u0BC6\u0BAF \u0BAA\u0BB4\u0B95\u0BC1"}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <JourneyTimeline currentStage={mockJourney.current_stage} />
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            You&apos;ve shown up for {mockJourney.continuity_month_count} months in a row.
            {nextStage ? ` Keep going to grow toward ${nextStage.en}.` : ""}
          </p>
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

        {/* Your Latest Act of Aram -- Evidence Card. mockLatestAct is
            temporary presentation-only mock data (see lib/mock-data.ts);
            Act of Aram is not a table in the locked Sprint 1 schema. Swap
            the ternary's truthy branch for a live query when the real
            entity ships -- the empty-state branch is left in place for
            that day. */}
        <Card className="flex flex-col gap-4">
          <SectionHeader title="Your Latest Act of Aram" />
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

        {/* Shared Acts of Aram -- no backing entity in Sprint 1 schema; empty state */}
        <Card className="flex flex-col gap-2">
          <SectionHeader title="Shared Acts of Aram" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            When your participation joins others toward the same Act of Aram, it will be shown
            here.
          </p>
        </Card>

        {/* குறள் கூறும் அறம் -- Kural Koorum Aram. mockKuralOfTheDay is
            temporary presentation-only mock data mirroring the future
            Founder Intelligence knowledge-engine record shape (FI-DB-003,
            KKA-001). Swap for a live query when that engine is connected;
            no UI change should be needed.

            Living Literature Prelude: this wrapping div carries the ref the
            IntersectionObserver above watches. It adds no styling of its
            own (no className) -- purely a DOM anchor point, since native
            elements always support refs and the Card component's ref-
            forwarding wasn't something to assume without verifying it. */}
        <div ref={kuralSectionRef}>
          <Card className="flex flex-col gap-5">
            <SectionHeader
              title={"\u0B95\u0BC1\u0BB1\u0BB3\u0BCD \u0B95\u0BC2\u0BB1\u0BC1\u0BAE\u0BCD \u0B85\u0BB1\u0BAE\u0BCD"}
              titleClassName="font-tamil-sans font-medium"
            />
            <p className="font-tamil-sans font-normal whitespace-pre-line py-2 text-left text-base leading-relaxed text-[var(--color-foreground)]">
              {mockKuralOfTheDay.kural_tamil}
            </p>

            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
              {mockKuralOfTheDay.core_principle}
            </p>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {mockKuralOfTheDay.aram_for_today_title}
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {mockKuralOfTheDay.aram_for_today_body}
              </p>
            </div>
            <Button variant="text" className="self-start">
              Practice this Kural →
            </Button>
          </Card>
        </div>

        {/* Sprint 04A (Living Region v1), Commit 3B.2: Activation
            Infrastructure. The Kural card above is untouched -- still the
            real, rendered experience. This mounts an invisible spacer +
            viewport observer + fixed interaction rectangle so alignment,
            touch handling, and scrolling can all be verified for real,
            without changing anything anyone sees. No verse is set yet
            (setLivingRegionVerse is never called in this commit), so
            pressing this zone exercises the Reflection Engine's real state
            machine but has nothing to reveal. Commit 3B.3 replaces the
            Kural card above with this zone, wired to the real verse. */}
        <LivingRegionZone />
      </main>

      <BottomNavigation active="home" />
    </div>
  );
}
