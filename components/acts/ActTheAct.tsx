"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const TEAL = "#0A363A";
const MINT = "#68FFAD";
// Existing --color-primary (globals.css) -- a darker green with enough
// contrast for an eyebrow label on the page's own light background,
// unlike MINT, which only reads clearly on the hero's dark teal.
const PRIMARY = "#328D63";

interface StoryMoment {
  title: string;
  image: string;
  description: string;
}

// The Act's own execution photographs. Only moments the real photos
// genuinely support are listed here -- there's no "ground being prepared"
// shot (every photo already shows an established, staked sapling), so
// "Prepare" is left out rather than invented. What the four supplied
// photos DO show, in order, is: a staked sapling standing in the ground,
// a protective net beginning to be wrapped around it, and a community
// member tying that guard in place by hand -- Plant, Nurture, Together.
const STORY_MOMENTS: StoryMoment[] = [
  {
    title: "Plant",
    image: "/mock/tree-planting-plant.jpg",
    description: "A young sapling stands newly planted, its stakes holding it steady as it takes root in the earth.",
  },
  {
    title: "Nurture",
    image: "/mock/tree-planting-nurture.jpg",
    description: "A protective cover is wrapped around it, shielding the young tree so it can grow safely.",
  },
  {
    title: "Together",
    image: "/mock/tree-planting-together.jpg",
    description: "A member of the community ties the guard in place, making sure this young tree is looked after.",
  },
];

function subscribeToReducedMotionChanges(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function readReducedMotionOnClient(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function readReducedMotionOnServer(): boolean {
  return false;
}

interface PhotoLayer {
  src: string;
  alt: string;
  visible: boolean;
}

/**
 * The one large photograph, crossfading between moments. Two stacked
 * layers (front/back) so the outgoing photo fades out while the incoming
 * one fades in at the same time, rather than a flash-to-blank swap.
 */
function MomentPhoto({
  moments,
  activeIndex,
  reducedMotion,
}: {
  moments: StoryMoment[];
  activeIndex: number;
  reducedMotion: boolean;
}) {
  const frontIndexRef = useRef(0);
  const [layers, setLayers] = useState<[PhotoLayer, PhotoLayer]>(() => [
    { src: moments[0].image, alt: moments[0].title, visible: true },
    { src: moments[0].image, alt: moments[0].title, visible: false },
  ]);

  useEffect(() => {
    const moment = moments[activeIndex];
    setLayers((previous) => {
      const frontIndex = frontIndexRef.current;
      const backIndex = frontIndex === 0 ? 1 : 0;
      const next: [PhotoLayer, PhotoLayer] = [...previous];
      next[backIndex] = { src: moment.image, alt: moment.title, visible: true };
      next[frontIndex] = { ...next[frontIndex], visible: false };
      frontIndexRef.current = backIndex;
      return next;
    });
  }, [activeIndex, moments]);

  return (
    <div className="relative w-full overflow-hidden rounded-[16px]" style={{ aspectRatio: "9 / 16" }}>
      {layers.map((layer, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={layer.src}
          alt={layer.alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "top",
            opacity: layer.visible ? 1 : 0,
            transition: reducedMotion ? "none" : "opacity 450ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      ))}
    </div>
  );
}

/**
 * A moment selector styled as compact highlighted text (Act Snapshot's
 * TextBar language: small rectangular highlight, tight padding, no pill
 * shape), not a conventional app button -- semantic <button> underneath
 * for keyboard/AT support, visual language on top.
 */
function MomentLabel({
  title,
  isSelected,
  onSelect,
}: {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`View the "${title}" moment of this Act`}
      className={`${inter.className} rounded-[5px] px-2.5 py-1.5 text-[13px] leading-none transition-colors`}
      style={{
        background: isSelected ? MINT : "rgba(10, 54, 58, 0.06)",
        color: isSelected ? TEAL : "rgba(10, 54, 58, 0.62)",
        fontWeight: isSelected ? 600 : 500,
      }}
    >
      {title}
    </button>
  );
}

/**
 * Act Detail's "The Act" section -- CA-011's visual story. Follows the
 * Abyssale reference's rhythm (eyebrow -> heading -> description -> one
 * large image -> selectable labels -> moment copy) without repeating any
 * of Act Snapshot's date/location/partner/quantity facts: this section is
 * about WHAT HAPPENED, told through the Act's own real photographs.
 *
 * storyMoments is data, not markup -- the component renders however many
 * moments (2-4) the real evidence supports, never padding out to a fixed
 * count. See the STORY_MOMENTS comment above for why this Act only has
 * three (no "Prepare" photo exists), not the full four.
 */
export function ActTheAct() {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChanges,
    readReducedMotionOnClient,
    readReducedMotionOnServer
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (STORY_MOMENTS.length === 0) return null;

  const activeMoment = STORY_MOMENTS[activeIndex];

  return (
    <section className="flex flex-col items-center gap-7 text-center">
      <div className="flex flex-col gap-2.5 px-2">
        <span
          className={`${inter.className} uppercase`}
          style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: PRIMARY }}
        >
          The Act
        </span>
        <h2
          className={`${calSans.className} m-0 text-[26px] font-bold leading-[1.15]`}
          style={{ color: TEAL, letterSpacing: "-0.3px" }}
        >
          From intention to earth
        </h2>
        <p
          className={`${inter.className} m-0 mx-auto max-w-[280px] text-[14px] leading-[1.55]`}
          style={{ color: "rgba(10, 54, 58, 0.78)" }}
        >
          An act begins with an intention, but becomes real when hands meet the earth.
        </p>
      </div>

      <MomentPhoto moments={STORY_MOMENTS} activeIndex={activeIndex} reducedMotion={reducedMotion} />

      <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Moments of this Act">
        {STORY_MOMENTS.map((moment, index) => (
          <MomentLabel
            key={moment.title}
            title={moment.title}
            isSelected={index === activeIndex}
            onSelect={() => setActiveIndex(index)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5 px-2">
        <h3 className={`${inter.className} m-0 text-[15px] font-semibold`} style={{ color: TEAL }}>
          {activeMoment.title}
        </h3>
        <p
          className={`${inter.className} m-0 mx-auto max-w-[300px] text-[13.5px] leading-[1.6]`}
          style={{ color: "rgba(10, 54, 58, 0.72)" }}
        >
          {activeMoment.description}
        </p>
      </div>
    </section>
  );
}
