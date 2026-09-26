"use client";

import { useEffect, useRef } from "react";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { EditorialHero } from "@/components/home/EditorialHero";
import { KuralKoorumAramSection } from "@/components/home/KuralKoorumAramSection";
import { onLivingFieldEngineReady } from "@/lib/living-field/engine-registry";
import { notifyEvent } from "@/lib/ambient-language/ambient-language";
import type { CurrentContributor } from "@/lib/contributor";
import type { PublishedActSummary } from "@/lib/published-acts";

// sharedAct and unreadNotificationCount are unused below while every
// section besides EditorialHero is out of render; kept in the signature
// since the caller still fetches and passes them for when those sections
// return.
export function HomeClient({
  contributor,
  sharedAct,
  latestAct,
  unreadNotificationCount,
}: {
  contributor: CurrentContributor;
  sharedAct: PublishedActSummary | null;
  latestAct: PublishedActSummary | null;
  unreadNotificationCount: number;
}) {
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
  // Kural Koorum Aram represents -- shortly BEFORE the Kural section
  // actually reaches the user's reading position at the footer.
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
    // #FFFFFF is scoped to Home only (inline style here), not the global
    // --color-background token in globals.css, so other pages are
    // unaffected. EditorialHero's own teal background is set on its own
    // section element and is untouched by this -- it stays locked.
    <div className="flex min-h-screen flex-col" style={{ background: "#FFFFFF" }}>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-28 pt-10">
        {/* All other Home sections besides EditorialHero and Kural Koorum
            Aram (original Hero, Next Action, Recent Impact, Shared Act,
            Opportunity) are temporarily removed while the page is
            rebuilt around this hero -- founder direction, 2026-09-26.
            Not deleted from history, just out of render for now. */}
        <EditorialHero
          displayName={contributor.displayName}
          latestActId={latestAct?.id ?? null}
        />

        {/* Kural Koorum Aram -- full redesign per founder's canvas mockup
            (2026-09-26), replacing the earlier testimonial-card pass.
            kuralSectionRef re-attached here so the Ambient Language
            Layer's IntersectionObserver above has a real DOM target
            again. */}
        <div ref={kuralSectionRef}>
          <KuralKoorumAramSection />
        </div>
      </main>

      <BottomNavigation active="home" />
    </div>
  );
}
