import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { ActSnapshot } from "@/components/acts/ActSnapshot";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

// Reuses Home's EditorialHero teal/mint pair exactly (components/home/
// EditorialHero.tsx) -- these two colors aren't in globals.css's LOCKED
// v1.1 tokens yet, so EditorialHero keeps them local to its own file
// rather than adding them there; this file does the same instead of
// inventing a second copy under new names.
const TEAL = "#0A363A";
const MINT = "#68FFAD";

function ActHeroImage({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="w-full overflow-hidden" style={{ aspectRatio: "4 / 5" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        // Existing (previously unused) fallback token, --color-photo-placeholder.
        <div className="h-full w-full" style={{ background: "var(--color-photo-placeholder)" }} />
      )}
    </div>
  );
}

function ActHeroContent({ cause, title, description }: { cause: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3 px-5 pb-6 pt-7">
      <span
        className={`${inter.className} uppercase`}
        style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "1.4px", color: "rgba(104, 255, 173, 0.68)" }}
      >
        {cause}
      </span>
      <h1
        className={`${calSans.className} m-0`}
        style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.4px", color: MINT }}
      >
        {title}
      </h1>
      <p
        className={`${inter.className} m-0`}
        style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255, 255, 255, 0.72)" }}
      >
        {description}
      </p>
    </div>
  );
}

/**
 * Act Detail's hero: a large, clean editorial photo -- no text or UI over
 * it -- followed immediately by ONE continuous deep-teal surface that
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
  heroImageUrl,
  title,
  description,
  cause,
}: {
  heroImageUrl: string | null;
  title: string;
  description: string;
  cause: string;
}) {
  return (
    <div className="-mx-5 -mt-6">
      <ActHeroImage src={heroImageUrl} alt={title} />
      <div className="rounded-[12px]" style={{ background: TEAL }}>
        <ActHeroContent cause={cause} title={title} description={description} />
        <ActSnapshot />
      </div>
    </div>
  );
}
