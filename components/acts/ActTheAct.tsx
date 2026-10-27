"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import localFont from "next/font/local";
import { ArrowRight } from "lucide-react";
import { ANNADHANAM_ELDERS_ACT_ID } from "@/lib/act-content-overrides";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({
  src: "../../app/fonts/InterVF.woff2",
  weight: "100 900",
  display: "swap",
});

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
  // CSS object-position for the 4:5 frame; the photos come in different
  // shapes (some wide landscape), so each picks the part that matters.
  focus?: string;
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
    description:
      "A young sapling stands newly planted, its stakes holding it steady as it takes root in the earth.",
  },
  {
    title: "Nurture",
    image: "/mock/tree-planting-nurture.jpg",
    description:
      "A protective cover is wrapped around it, shielding the young tree so it can grow safely.",
  },
  {
    title: "Together",
    image: "/mock/tree-planting-together.jpg",
    description:
      "A member of the community ties the guard in place, making sure this young tree is looked after.",
  },
];

// Annadhanam for Elders' own three real photographs -- the single
// supporting line the founder supplied is reused for all three states
// (no distinct per-moment copy was given, so none is invented).
const ANNADHANAM_HEADING = "Where Care Becomes a Meal";
const ANNADHANAM_DESCRIPTION =
  "A simple intention became a meal prepared with care, served with dignity, and shared with our elders.";
const ANNADHANAM_STORY_MOMENTS: StoryMoment[] = [
  {
    title: "Prepared",
    image: "/mock/annadhanam-prepared.jpg",
    description: ANNADHANAM_DESCRIPTION,
    focus: "46% 50%",
  },
  {
    title: "Served",
    image: "/mock/annadhanam-served-woman.jpg",
    description: ANNADHANAM_DESCRIPTION,
    focus: "50% 38%",
  },
  {
    title: "Shared",
    image: "/mock/annadhanam-shared.jpg",
    description: ANNADHANAM_DESCRIPTION,
    focus: "93% 50%",
  },
];

// Staged entrance, played once as the card arrives: the heading rises, the
// description follows, the photo opens like an iris, and the chips pop in one
// after another. The hidden state only exists once the page has hydrated and
// the card is still below the fold (data-care), so without JS -- or for a card
// already on screen -- everything is simply visible. The attribute is dropped
// again once the entrance has played, so the chips' own colour transitions are
// never delayed afterwards.
const CARE_CSS = `
  .care-h, .care-p { transition: opacity 600ms ease, translate 700ms cubic-bezier(0.22, 1, 0.36, 1); }
  .care-p { transition-delay: 120ms; }
  .care-photo { transition: clip-path 1000ms cubic-bezier(0.22, 1, 0.36, 1) 250ms; }
  .care-chip { transition: opacity 450ms ease, translate 500ms cubic-bezier(0.22, 1, 0.36, 1), scale 500ms cubic-bezier(0.22, 1, 0.36, 1), background-color 150ms ease, color 150ms ease; transition-delay: calc(750ms + var(--i) * 110ms), calc(750ms + var(--i) * 110ms), calc(750ms + var(--i) * 110ms), 0ms, 0ms; }
  [data-care="hidden"] .care-h, [data-care="hidden"] .care-p { opacity: 0; translate: 0 16px; }
  [data-care="hidden"] .care-photo { clip-path: circle(0% at 50% 50%); }
  [data-care="revealed"] .care-photo { clip-path: circle(85% at 50% 50%); }
  [data-care="hidden"] .care-chip { opacity: 0; translate: 0 10px; scale: 0.92; }
  /* While the empty card waits below the fold it tugs up and gives a small
     shake every few seconds, like a handle waiting to be pulled. */
  @keyframes care-tug {
    0%, 45%, 100% { translate: 0 0; rotate: 0deg; }
    54% { translate: 0 -16px; rotate: 0deg; }
    60% { translate: -4px -16px; rotate: -1.2deg; }
    66% { translate: 4px -16px; rotate: 1.2deg; }
    72% { translate: -3px -16px; rotate: -0.9deg; }
    78% { translate: 3px -16px; rotate: 0.9deg; }
    84% { translate: 0 -16px; rotate: 0deg; }
    94% { translate: 0 0; rotate: 0deg; }
  }
  [data-care="hidden"] { transform-origin: 50% 0; animation: care-tug 2.2s ease-in-out infinite; }
`;
const CARE_REVEAL_DONE_MS = 1900;

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
  position: string;
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
    {
      src: moments[0].image,
      alt: moments[0].title,
      visible: true,
      position: moments[0].focus ?? "top",
    },
    {
      src: moments[0].image,
      alt: moments[0].title,
      visible: false,
      position: moments[0].focus ?? "top",
    },
  ]);

  useEffect(() => {
    const moment = moments[activeIndex];
    setLayers((previous) => {
      const frontIndex = frontIndexRef.current;
      const backIndex = frontIndex === 0 ? 1 : 0;
      const next: [PhotoLayer, PhotoLayer] = [...previous];
      next[backIndex] = {
        src: moment.image,
        alt: moment.title,
        visible: true,
        position: moment.focus ?? "top",
      };
      next[frontIndex] = { ...next[frontIndex], visible: false };
      frontIndexRef.current = backIndex;
      return next;
    });
  }, [activeIndex, moments]);

  return (
    <div
      className="care-photo relative w-full overflow-hidden"
      style={{ aspectRatio: "4 / 5" }}
    >
      {layers.map((layer, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={layer.src}
          alt={layer.alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: layer.position,
            opacity: layer.visible ? 1 : 0,
            transition: reducedMotion
              ? "none"
              : "opacity 450ms cubic-bezier(0.22, 1, 0.36, 1)",
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
  index,
  isSelected,
  onSelect,
}: {
  title: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`View the "${title}" moment of this Act`}
      className={`${inter.className} care-chip flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-1.5 py-2.5 leading-none transition-colors`}
      style={{
        // Fluid so all the chips always fit one row (the row is a size
        // container, see ActTheAct).
        fontSize: "clamp(10.5px, 4.3cqw, 12.5px)",
        ["--i" as string]: index,
        background: isSelected ? CHIP_SELECTED_BG : CHIP_UNSELECTED_BG,
        color: isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)",
        fontWeight: isSelected ? 600 : 500,
      }}
    >
      {title}
      <ArrowRight
        size="1.05em"
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
export function ActTheAct({ actId }: { actId: string }) {
  const isAnnadhanamElders = actId === ANNADHANAM_ELDERS_ACT_ID;
  const storyMoments = isAnnadhanamElders
    ? ANNADHANAM_STORY_MOMENTS
    : STORY_MOMENTS;
  const heading = isAnnadhanamElders
    ? ANNADHANAM_HEADING
    : "From intention to earth";

  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChanges,
    readReducedMotionOnClient,
    readReducedMotionOnServer,
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // The staged entrance (see CARE_CSS): hide once the card is known to be
  // below the fold, reveal when it has risen ~25% into view.
  const sectionRef = useRef<HTMLElement>(null);
  const [care, setCare] = useState<"hidden" | "revealed" | undefined>(
    undefined,
  );
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reducedMotion) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    let hidden = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!started) {
          started = true;
          if (entry.isIntersecting) {
            observer.disconnect(); // already on screen: no entrance
            return;
          }
          hidden = true;
          setCare("hidden");
          return;
        }
        if (hidden && entry.isIntersecting) {
          setCare("revealed");
          observer.disconnect();
          timer = setTimeout(() => setCare(undefined), CARE_REVEAL_DONE_MS);
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [reducedMotion]);

  if (storyMoments.length === 0) return null;

  const activeMoment = storyMoments[activeIndex];

  return (
    <section
      id="act-the-act"
      ref={sectionRef}
      data-care={care}
      className="rounded-[16px] px-5 py-6"
      style={{ background: TEAL }}
    >
      <style>{CARE_CSS}</style>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5 text-center">
          <h2
            className={`${calSans.className} care-h m-0 text-[24px] font-bold leading-[1.15]`}
            style={{ color: MINT, letterSpacing: "-0.3px" }}
          >
            {heading}
          </h2>
          <p
            className={`${inter.className} care-p m-0 text-[14px] leading-[1.55]`}
            style={{ color: "rgba(255, 255, 255, 0.82)" }}
          >
            {activeMoment.description}
          </p>
        </div>

        <MomentPhoto
          moments={storyMoments}
          activeIndex={activeIndex}
          reducedMotion={reducedMotion}
        />

        <div
          className="flex flex-nowrap items-center gap-2"
          role="group"
          aria-label="Moments of this Act"
          style={{ containerType: "inline-size" }}
        >
          {storyMoments.map((moment, index) => (
            <MomentChip
              key={moment.title}
              title={moment.title}
              index={index}
              isSelected={index === activeIndex}
              onSelect={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
