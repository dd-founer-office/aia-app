"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import localFont from "next/font/local";
import { ArrowRight } from "lucide-react";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

// Reuses ActDetailHero/ActSnapshot's exact teal/mint pair for the card
// surface and heading.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

// Chip colors pixel-sampled directly from the Abyssale reference's own
// tag chips (rgb(31,106,127) selected, rgb(17,70,78) unselected) -- a
// teal-blue accent distinct from TEAL/MINT, local to this component since
// nothing else in the app uses it yet.
const CHIP_SELECTED_BG = "#1F6A7F";
const CHIP_UNSELECTED_BG = "#12454C";

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
 * The one photograph, crossfading between moments. Two stacked layers
 * (front/back) so the outgoing photo fades out while the incoming one
 * fades in at the same time, rather than a flash-to-blank swap. Sharp
 * corners and a smaller frame, matching the Abyssale reference's own
 * inset (not edge-to-edge) image treatment.
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
    <div className="relative mx-auto w-[62%] overflow-hidden" style={{ aspectRatio: "9 / 16" }}>
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
 * A moment selector styled after the Abyssale reference's own tag chips
 * (colors pixel-matched), but with a single arrow glyph standing in for
 * its +/x pair: pointing right while unselected ("tap to view"), rotating
 * to point up once selected ("this one is open above").
 */
function MomentChip({
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
      className={`${inter.className} flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13.5px] leading-none transition-colors`}
      style={{
        background: isSelected ? CHIP_SELECTED_BG : CHIP_UNSELECTED_BG,
        color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
        fontWeight: isSelected ? 600 : 500,
      }}
    >
      {title}
      <ArrowRight
        size={14}
        style={{
          transform: isSelected ? "rotate(-90deg)" : "rotate(0deg)",
          transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </button>
  );
}

/**
 * Act Detail's "The Act" section -- CA-011's visual story. A dark teal
 * card (same TEAL surface as the hero, pixel-matched to the Abyssale
 * reference's own card background) carrying a left-aligned mint heading,
 * a single description that swaps to the selected moment's own copy, one
 * smaller sharp-cornered photo, and the moment chips -- without repeating
 * any of Act Snapshot's date/location/partner/quantity facts: this
 * section is about WHAT HAPPENED, told through the Act's own real
 * photographs.
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
    <section className="rounded-[16px] px-5 py-6" style={{ background: TEAL }}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5 text-left">
          <h2
            className={`${calSans.className} m-0 text-[24px] font-bold leading-[1.15]`}
            style={{ color: MINT, letterSpacing: "-0.3px" }}
          >
            From intention to earth
          </h2>
          <p className={`${inter.className} m-0 text-[14px] leading-[1.55]`} style={{ color: "rgba(255, 255, 255, 0.82)" }}>
            {activeMoment.description}
          </p>
        </div>

        <MomentPhoto moments={STORY_MOMENTS} activeIndex={activeIndex} reducedMotion={reducedMotion} />

        <div className="flex flex-wrap items-center justify-center gap-2.5" role="group" aria-label="Moments of this Act">
          {STORY_MOMENTS.map((moment, index) => (
            <MomentChip
              key={moment.title}
              title={moment.title}
              isSelected={index === activeIndex}
              onSelect={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
