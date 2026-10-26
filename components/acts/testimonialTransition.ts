// The collage screen -> "They say it better" transition: the blank teal
// screen shrinks into the testimonial video's rounded frame, and the play
// button from the collage screen travels into the video's own play button.
//
// How it works, in order:
//  1. A fixed teal overlay (identical to the blank collage screen) covers
//     the viewport, and a clone of the collage play button is lifted onto it.
//  2. Under that cover the page jumps (instantly) so the testimonial section
//     is at the top -- the visitor never sees the scroll.
//  3. The overlay clips down to the video's rounded rectangle while the
//     clone flies to the video's play-button spot (colour-morphing from mint
//     to the video button's dark teal).
//  4. The heading rises in as the shrink starts to settle; then the overlay
//     fades to reveal the poster, the real play button takes over from the
//     clone, and the quote fades up last.
// The testimonial section's own reveal states are driven by a
// `data-reveal` attribute (see ActTestimonial); it carries no styling on
// pages that never run this transition.

const TEAL = "#0A363A";
const SHRINK_MS = 750;
const SHRINK_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const HEADING_AT_MS = 350;
const FADE_MS = 300;
const REST_AT_MS = SHRINK_MS + 150;
const END_AT_MS = SHRINK_MS + 550;
const VIDEO_RADIUS_PX = 16;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export const TESTIMONIAL_ID = "act-testimonial";

function jumpTo(top: number) {
  // `instant` isn't in every lib.dom.d.ts yet; a plain scrollTo with the
  // default behaviour is instant here because the page sets no
  // scroll-behavior.
  window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
}

export async function playTestimonialTransition(
  cta: HTMLElement | null,
): Promise<void> {
  const section = document.getElementById(TESTIMONIAL_ID);
  if (!section) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const videoFrame = section.querySelector<HTMLElement>("[data-tm-video]");
  const playButton = section.querySelector<HTMLElement>("[data-tm-play]");

  if (reduced || !videoFrame || !playButton || !cta) {
    jumpTo(section.getBoundingClientRect().top + window.scrollY);
    return;
  }

  const from = cta.getBoundingClientRect();

  // 1. Cover, and lift the button onto the cover.
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "60",
    background: TEAL,
    clipPath: "inset(0px 0px 0px 0px round 0px)",
  });
  document.body.appendChild(overlay);

  const clone = cta.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.setAttribute("aria-hidden", "true");
  clone.tabIndex = -1;
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "61",
    pointerEvents: "none",
    transformOrigin: "0 0",
    opacity: "1",
    animation: "none",
  });
  document.body.appendChild(clone);
  // The real button hands over to the clone (same rect, same look).
  cta.style.visibility = "hidden";
  clone.querySelector<HTMLElement>(".aia-cta-ring")?.remove();

  const cleanup = () => {
    overlay.remove();
    clone.remove();
    cta.style.visibility = "";
    delete section.dataset.reveal;
  };

  try {
    // 2. Jump under the cover; the section's reveal parts start hidden.
    section.dataset.reveal = "hidden";
    jumpTo(section.getBoundingClientRect().top + window.scrollY);
    await nextFrame();
    await nextFrame();

    // 3. Measure the destination and fly.
    const v = videoFrame.getBoundingClientRect();
    const p = playButton.getBoundingClientRect();
    const o = overlay.getBoundingClientRect();
    const toClip = `inset(${v.top - o.top}px ${o.right - v.right}px ${o.bottom - v.bottom}px ${v.left - o.left}px round ${VIDEO_RADIUS_PX}px)`;

    overlay.animate(
      [{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: toClip }],
      { duration: SHRINK_MS, easing: SHRINK_EASE, fill: "forwards" },
    );

    const scale = p.width / from.width;
    clone.animate(
      [
        {
          transform: "translate(0px, 0px) scale(1)",
          backgroundColor: "#68FFAD",
          color: TEAL,
          borderColor: "rgba(255, 255, 255, 0)",
        },
        {
          transform: `translate(${p.left - from.left}px, ${p.top - from.top}px) scale(${scale})`,
          backgroundColor: TEAL,
          color: "#FFFFFF",
          borderColor: "rgba(255, 255, 255, 0.55)",
        },
      ],
      { duration: SHRINK_MS, easing: SHRINK_EASE, fill: "forwards" },
    );

    // 4. Staged reveal of the section.
    await wait(HEADING_AT_MS);
    section.dataset.reveal = "heading";
    await wait(SHRINK_MS - HEADING_AT_MS);
    section.dataset.reveal = "video";
    overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: FADE_MS,
      fill: "forwards",
    });
    await wait(60);
    clone.remove();
    await wait(REST_AT_MS - SHRINK_MS - 60);
    section.dataset.reveal = "all";
    await wait(END_AT_MS - REST_AT_MS);
  } finally {
    cleanup();
  }
}
