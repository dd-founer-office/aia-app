import localFont from "next/font/local";
import {
  ActSnapshot,
  type SnapshotContent,
} from "@/components/acts/ActSnapshot";
import { HeroCta } from "@/components/acts/HeroCta";
import { HeroFit } from "@/components/acts/HeroFit";

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

// Reuses Home's EditorialHero teal/mint pair exactly (components/home/
// EditorialHero.tsx) -- these two colors aren't in globals.css's LOCKED
// v1.1 tokens yet, so EditorialHero keeps them local to its own file
// rather than adding them there; this file does the same instead of
// inventing a second copy under new names.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

function ActHeroImage({
  src,
  alt,
  objectPosition,
}: {
  src: string | null;
  alt: string;
  objectPosition: string;
}) {
  return (
    <div
      className="w-full overflow-hidden"
      // Square at minimum; grows (up to 4:5) when the phone is tall enough
      // that photo + text would otherwise leave dead space in the first
      // screen. 488px = page max-w-md (448) + two -mx-5 bleeds; 28px = the
      // panel's overlap onto the photo. --hero-text-h is set by HeroFit
      // (300px is only the pre-hydration estimate).
      style={{
        height:
          "clamp(min(100vw, 488px), calc(100svh - var(--hero-text-h, 300px) + 28px), calc(min(100vw, 488px) * 1.25))",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      ) : (
        // Existing (previously unused) fallback token, --color-photo-placeholder.
        <div
          className="h-full w-full"
          style={{ background: "var(--color-photo-placeholder)" }}
        />
      )}
    </div>
  );
}

// Splits the (newline-flattened) title around the first whole-word match of
// `word`, so that word can be wrapped in the selection-box highlight.
function renderTitle(title: string, word?: string) {
  const flat = title.replace(/\s*\n\s*/g, " ");
  if (!word) return flat;
  const match = new RegExp(
    `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
  ).exec(flat);
  if (!match) return flat;
  return (
    <>
      {flat.slice(0, match.index)}
      <span className="aia-hero-highlight">
        {match[0]}
        <i
          aria-hidden="true"
          className="aia-hero-handle"
          style={{ top: -4, left: -4 }}
        />
        <i
          aria-hidden="true"
          className="aia-hero-handle"
          style={{ top: -4, right: -4 }}
        />
        <i
          aria-hidden="true"
          className="aia-hero-handle"
          style={{ bottom: -4, left: -4 }}
        />
        <i
          aria-hidden="true"
          className="aia-hero-handle"
          style={{ bottom: -4, right: -4 }}
        />
      </span>
      {flat.slice(match.index + match[0].length)}
    </>
  );
}

// The highlighted word reads white inside a lighter-teal selection box with
// four small mint corner handles (the Abyssale hero treatment); the box
// scales/fades in once shortly after load. Static under reduced motion.
const HIGHLIGHT_CSS = `
  .aia-hero-highlight { position: relative; isolation: isolate; display: inline-block; color: #FFFFFF; padding: 0 0.1em; margin: 0 0.02em; }
  .aia-hero-highlight::before { content: ""; position: absolute; inset: 0.04em 0; z-index: -1; background: rgba(255, 255, 255, 0.1); animation: aia-hero-box-in 600ms cubic-bezier(0.22, 1, 0.36, 1) 500ms both; transform-origin: left center; }
  .aia-hero-handle { position: absolute; width: 8px; height: 8px; border-radius: 2px; background: ${MINT}; animation: aia-hero-handle-in 400ms ease 900ms both; }
  @keyframes aia-hero-box-in { from { opacity: 0; transform: scaleX(0.4); } to { opacity: 1; transform: scaleX(1); } }
  @keyframes aia-hero-handle-in { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .aia-hero-highlight::before, .aia-hero-handle { animation: none; } }
`;

function ActHeroContent({
  cause,
  title,
  description,
  showEyebrow,
  highlightWord,
  ctaLabel,
  ctaTargetId,
}: {
  cause: string;
  title: string;
  description: string;
  showEyebrow: boolean;
  highlightWord?: string;
  ctaLabel: string;
  ctaTargetId: string;
}) {
  return (
    <div
      data-hero-text
      className="flex flex-col items-center justify-center gap-2.5 px-5 pb-8 pt-6 text-center"
      // On tall phones the photo stops at 4:5; whatever height is then left
      // of the first screen becomes this block's min-height, and the
      // content centers inside it instead of leaving a dead patch below.
      // 488px = page max-w-md (448) + two -mx-5 bleeds; 28px = overlap.
      style={{
        minHeight: "max(0px, calc(100svh - min(100vw, 488px) * 1.25 + 28px))",
      }}
    >
      <style>{HIGHLIGHT_CSS}</style>
      {showEyebrow && (
        <span
          className={`${inter.className} uppercase`}
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "1.4px",
            color: "rgba(104, 255, 173, 0.68)",
          }}
        >
          {cause}
        </span>
      )}
      <h1
        className={`${calSans.className} m-0`}
        // Title text may carry an embedded "\n" (the Annadhanam Act's two
        // sentences); it is flattened to a space so lines flow naturally and
        // a short sentence never strands one word on its own line.
        style={{
          fontSize: "clamp(24px, 7.2vw, 32px)",
          fontWeight: 700,
          lineHeight: 1.42,
          letterSpacing: "-0.4px",
          color: MINT,
          textWrap: "balance",
        }}
      >
        {renderTitle(title, highlightWord)}
      </h1>
      <p
        className={`${inter.className} m-0 max-w-[34ch]`}
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: "rgba(255, 255, 255, 0.78)",
        }}
      >
        {description}
      </p>
      <div className="mt-4">
        <HeroCta label={ctaLabel} targetId={ctaTargetId} />
      </div>
    </div>
  );
}

/**
 * Act Detail's hero: a square, clean editorial photo -- no text or UI over
 * it -- with ONE continuous deep-teal surface that overlaps its bottom
 * edge and scrolls up over it (the photo + title + description are the
 * first mobile screen). The teal surface
 * carries the eyebrow/title/description AND the Act Snapshot collage
 * with no seam between them (per founder direction: the whole thing
 * should read as one editorial hero, not a hero card plus a separate
 * snapshot card). Reuses Home's EditorialHero teal/mint pair and Acts'
 * EditorialActCard's Cal Sans/Inter treatment. Full-bleed to the true
 * viewport edges (-mx-5 -mt-6 cancels the page wrapper's own px-5/pt-6);
 * the teal surface is rounded top AND bottom at the same 12px radius
 * EditorialHero uses for its own full-bleed teal section -- top rounds
 * against the photo above it, bottom closes the surface off before the
 * page's inset (px-5) sections below, both revealing the page's own
 * background in the notch rather than either edge being a new card.
 */
export function ActDetailHero({
  actId,
  heroImageUrl,
  title,
  description,
  cause,
  showEyebrow = true,
  imageObjectPosition = "center",
  highlightWord,
  ctaLabel = "See the story",
  snapshotContent,
}: {
  actId: string;
  heroImageUrl: string | null;
  title: string;
  description: string;
  cause: string;
  // Both default to the existing behavior -- every Act besides the one
  // caller that sets them explicitly (PublishedActDetail, for Annadhanam
  // for Elders) renders exactly as before.
  showEyebrow?: boolean;
  imageObjectPosition?: string;
  // Word in `title` shown in the white selection-box highlight, and the
  // label of the CTA that scrolls to the Act Snapshot panel.
  highlightWord?: string;
  ctaLabel?: string;
  snapshotContent?: SnapshotContent;
}) {
  return (
    <div className="-mx-5 -mt-6">
      <HeroFit />
      {/* The photo is pinned (sticky) at the top of the viewport, and the
          teal panel -- pulled up over its bottom edge by -mt-7 -- scrolls
          up over it, so the photo is covered as the visitor scrolls. The
          panel must stay opaque and above it (z-10) for that to work. */}
      <div className="sticky top-0 z-0">
        <ActHeroImage
          src={heroImageUrl}
          alt={title.replace(/\s*\n\s*/g, " ")}
          objectPosition={imageObjectPosition}
        />
      </div>
      <div
        className="relative z-10 -mt-7 rounded-[12px]"
        style={{ background: TEAL }}
      >
        <ActHeroContent
          cause={cause}
          title={title}
          description={description}
          showEyebrow={showEyebrow}
          highlightWord={highlightWord}
          ctaLabel={ctaLabel}
          ctaTargetId="act-snapshot"
        />
        <div id="act-snapshot">
          <ActSnapshot actId={actId} content={snapshotContent} />
        </div>
      </div>
      {/* White backing under the panel's rounded bottom corners, so the
          pinned photo can't show through the notch while it scrolls. */}
      <div aria-hidden="true" className="relative z-[5] -mt-3 h-3 bg-white" />
    </div>
  );
}
