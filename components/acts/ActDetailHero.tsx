import localFont from "next/font/local";
import { ActSnapshot } from "@/components/acts/ActSnapshot";
import { ScrollCue } from "@/components/acts/ScrollCue";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

// Reuses Home's EditorialHero teal/mint pair exactly (components/home/
// EditorialHero.tsx) -- these two colors aren't in globals.css's LOCKED
// v1.1 tokens yet, so EditorialHero keeps them local to its own file
// rather than adding them there; this file does the same instead of
// inventing a second copy under new names.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

function ActHeroImage({ src, alt, objectPosition }: { src: string | null; alt: string; objectPosition: string }) {
  return (
    <div className="w-full overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
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
        <div className="h-full w-full" style={{ background: "var(--color-photo-placeholder)" }} />
      )}
    </div>
  );
}

function ActHeroContent({
  cause,
  title,
  description,
  showEyebrow,
}: {
  cause: string;
  title: string;
  description: string;
  showEyebrow: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 px-5 pb-[76px] pt-6"
      // The photo (square, full hero width) + this block fill exactly one
      // small-viewport screen, so the snapshot below only appears on
      // scroll. 488px = the page's max-w-md (448) + its two -mx-5 bleeds;
      // 28px = the panel's overlap onto the photo (-mt-7 below).
      style={{ minHeight: "calc(100svh - min(100vw, 488px) + 28px)" }}
    >
      {showEyebrow && (
        <span
          className={`${inter.className} uppercase`}
          style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: "rgba(104, 255, 173, 0.68)" }}
        >
          {cause}
        </span>
      )}
      <h1
        className={`${calSans.className} m-0`}
        // Title text may carry an embedded "\n" (the Annadhanam Act's two
        // sentences); render it as a plain space so lines flow naturally and
        // a short sentence never strands one word on its own line.
        style={{ fontSize: "clamp(24px, 7.2vw, 32px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.4px", color: MINT, textWrap: "pretty" }}
      >
        {title.replace(/\s*\n\s*/g, " ")}
      </h1>
      <p
        className={`${inter.className} m-0`}
        style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255, 255, 255, 0.78)" }}
      >
        {description}
      </p>
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
}) {
  return (
    <div className="-mx-5 -mt-6">
      <ScrollCue targetId="act-snapshot" />
      {/* The photo is pinned (sticky) at the top of the viewport, and the
          teal panel -- pulled up over its bottom edge by -mt-7 -- scrolls
          up over it, so the photo is covered as the visitor scrolls. The
          panel must stay opaque and above it (z-10) for that to work. */}
      <div className="sticky top-0 z-0">
        <ActHeroImage src={heroImageUrl} alt={title.replace(/\s*\n\s*/g, " ")} objectPosition={imageObjectPosition} />
      </div>
      <div className="relative z-10 -mt-7 rounded-[12px]" style={{ background: TEAL }}>
        <ActHeroContent cause={cause} title={title} description={description} showEyebrow={showEyebrow} />
        <div id="act-snapshot">
          <ActSnapshot actId={actId} />
        </div>
      </div>
      {/* White backing under the panel's rounded bottom corners, so the
          pinned photo can't show through the notch while it scrolls. */}
      <div aria-hidden="true" className="relative z-[5] -mt-3 h-3 bg-white" />
    </div>
  );
}
