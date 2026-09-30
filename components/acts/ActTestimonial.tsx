"use client";

import { useEffect, useRef, useState } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Play } from "lucide-react";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

// Reuses ActDetailHero/ActSnapshot's exact teal/mint pair -- pixel-sampled
// directly from the Abyssale reference screenshot (its button background
// is rgb(10,54,58), its button text rgb(104,255,173): TEAL and MINT to
// the digit), so this section's colors are both "matching the reference"
// and "an existing AiA token" at once, not a coincidence to reconcile.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

// A real 16:9 frame from the real video below (see poster comment) --
// never a generated thumbnail.
const VIDEO_SRC = "/mock/tree-planting-testimonial.mp4";
const POSTER_SRC = "/mock/tree-planting-testimonial-poster.jpg";

// Vendor-prefixed fullscreen APIs aren't in lib.dom.d.ts.
interface FullscreenVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitRequestFullscreen?: () => void;
}

// lib.dom.d.ts's own ScreenOrientation type leaves `lock` effectively
// uncallable (typed as `unknown`) -- this is the real (Android-Chrome-only)
// shape of the method we actually call below.
interface LockableScreenOrientation {
  lock?: (orientation: "landscape" | "portrait") => Promise<void>;
  unlock?: () => void;
}

function PlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      className="absolute flex items-center justify-center rounded-full"
      style={{
        right: 14,
        bottom: 14,
        width: 52,
        height: 52,
        background: TEAL,
        border: "2px solid rgba(255, 255, 255, 0.55)",
      }}
    >
      <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
    </button>
  );
}

/**
 * Act Detail's "They Say It Better" section -- CA-011's Living Moment.
 * Follows the Abyssale reference structure (heading -> short description
 * -> large video with a bottom-right play button -> quote + CTA), reusing
 * ActDetailHero/ActSnapshot's teal/mint pair rather than the reference's
 * own literal colors, since pixel-sampling the reference showed they're
 * the same colors already. Full-bleed pure-white surface (like
 * ActDetailHero's own -mx-5 full-bleed teal surface) rather than the
 * page's own off-white background, matching the reference's clean white
 * canvas exactly.
 *
 * The video/poster are the real uploaded tree-planting recording -- no
 * generated thumbnail. The quote below is the real Tamil blessing given
 * by its speakers, attributed to them directly (Inmates, Annai Aravindar
 * Karunai Illam) rather than the Tree Planting Team placeholder credit
 * used before this content was supplied.
 */
export function ActTestimonial() {
  const videoRef = useRef<FullscreenVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      if (document.fullscreenElement) return;
      const orientation = screen.orientation as unknown as LockableScreenOrientation;
      try {
        orientation.unlock?.();
      } catch {
        // Nothing to unlock on browsers that never locked it -- ignore.
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function playInline() {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay-with-sound can be rejected without a direct gesture on
      // some browsers -- this IS a direct tap gesture, so this is just a
      // defensive no-op for the rare rejection.
    });
  }

  async function viewFullScreen() {
    const video = videoRef.current;
    if (!video) return;

    // iOS Safari: <video> has its own native fullscreen player that
    // handles landscape rotation itself -- the standard Fullscreen API
    // isn't available for video on iOS, so this is the real entry point
    // there, not a fallback.
    if (typeof video.webkitEnterFullscreen === "function") {
      video.webkitEnterFullscreen();
      playInline();
      return;
    }

    try {
      if (video.requestFullscreen) {
        await video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen request rejected (unsupported, blocked, etc.) -- the
      // video still plays inline below, just not full-screen.
    }

    playInline();

    const orientation = screen.orientation as unknown as LockableScreenOrientation;
    try {
      await orientation.lock?.("landscape");
    } catch {
      // Orientation locking is Android-Chrome-in-fullscreen only --
      // desktop and unsupported browsers reject this silently, which
      // is expected, not an error to surface.
    }
  }

  return (
    <section
      className="-mx-5 flex flex-col items-center gap-8 px-5 py-10 text-center"
      style={{ background: "#FFFFFF" }}
    >
      <div className="flex flex-col gap-2.5 px-2">
        <h2
          className={`${calSans.className} m-0 text-[26px] font-bold leading-[1.15]`}
          style={{ color: TEAL, letterSpacing: "-0.3px" }}
        >
          They say it better
        </h2>
        <p
          className={`${inter.className} m-0 mx-auto max-w-[280px] text-[14px] leading-[1.55]`}
          style={{ color: "rgba(10, 54, 58, 0.78)" }}
        >
          Listen to the people who planted these trees share what this act means to them.
        </p>
      </div>

      <div className="relative w-full overflow-hidden rounded-[16px]" style={{ aspectRatio: "16 / 9" }}>
        <video
          ref={videoRef}
          className="h-full w-full bg-black object-cover"
          poster={POSTER_SRC}
          playsInline
          controls={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        {!isPlaying && <PlayButton onClick={playInline} />}
      </div>

      {/* Reference's structure is quote-left / button-right in one row,
          both top-aligned; that row would squeeze the quote into an
          unreadably narrow column at mobile widths, so it stacks below
          sm and sits side-by-side from sm up, per the brief's own
          "stack intelligently on narrow mobile" allowance. */}
      <div className="flex w-full flex-col items-start gap-5 text-left sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2.5">
          {/* Real quote, in the speakers' own words -- Tamil, so it's set
              in the app's existing Noto Sans Tamil (--font-tamil-sans,
              loaded globally in app/layout.tsx), not Inter, which has no
              Tamil glyphs to shape it correctly. */}
          <p
            className="m-0 text-[17px] font-bold leading-[1.5]"
            style={{ color: TEAL, fontFamily: "var(--font-tamil-sans)" }}
          >
            &ldquo;வாழ்வில் எல்லா நலமும் வளமும் பெற்று பல்லாண்டு காலம் வாழவேண்டும்&rdquo;
          </p>
          <p className={`${inter.className} m-0 mt-1 text-[12px] font-semibold`} style={{ color: TEAL }}>
            Inmates
            <span className={`${inter.className} block font-normal`} style={{ color: "rgba(10, 54, 58, 0.55)" }}>
              Annai Aravindar Karunai Illam
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={viewFullScreen}
          className={`${inter.className} shrink-0 self-start rounded-[16px] px-6 py-4 text-[15px] font-bold leading-[1.25]`}
          style={{ background: TEAL, color: MINT }}
        >
          Full
          <br />
          Screen
        </button>
      </div>
    </section>
  );
}
