"use client";

import { useEffect } from "react";
import { TESTIMONIAL_ID } from "@/components/acts/testimonialTransition";

// The card that follows the testimonial (see ActTheAct); the fade only runs
// on pages where it exists.
const NEXT_ID = "act-the-act";
// Measured from how far the testimonial has scrolled up past its resting
// position (where its top meets the top of the screen): nothing happens for
// the first FADE_START_PX, so the section looks untouched when the visitor
// lands on it, then it fades out over the next 45% of the viewport height.
// (The next card is already partly on screen at that resting position, so a
// threshold based on the card's own position would fade it on arrival.)
const FADE_START_PX = 40;
const FADE_SPAN = 0.45;

/**
 * As the next card ("Where Care Becomes a Meal") arrives, the testimonial is
 * not left hanging around: it fades out into the white page, and its video
 * stops (it stays paused if the visitor scrolls back, with the play button
 * showing). Scroll-linked, so scrolling back up brings it back in. Renders
 * nothing; it only drives the two existing sections by id.
 */
export function TestimonialFadeOut() {
  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const testimonial = document.getElementById(TESTIMONIAL_ID);
      if (!testimonial || !document.getElementById(NEXT_ID)) return;

      const scrolledPast = -testimonial.getBoundingClientRect().top;
      const progress = Math.min(
        1,
        Math.max(
          0,
          (scrolledPast - FADE_START_PX) / (FADE_SPAN * window.innerHeight),
        ),
      );

      testimonial.style.opacity = String(1 - progress);
      // Once it is gone it must not catch taps meant for what is on screen.
      testimonial.style.pointerEvents = progress > 0.9 ? "none" : "";

      if (progress > 0.02) {
        const video = testimonial.querySelector("video");
        if (video && !video.paused) video.pause();
      }
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      const testimonial = document.getElementById(TESTIMONIAL_ID);
      if (testimonial) {
        testimonial.style.opacity = "";
        testimonial.style.pointerEvents = "";
      }
    };
  }, []);

  return null;
}
