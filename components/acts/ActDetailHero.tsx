import localFont from "next/font/local";
import { Inter } from "next/font/google";

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

function ActHeroContent({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-t-[12px] px-5 pb-8 pt-7" style={{ background: TEAL }}>
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
 * it -- followed immediately by a deep-teal content panel, reusing
 * Home's EditorialHero teal/mint pair and Acts' EditorialActCard's Cal
 * Sans/Inter treatment, per the founder direction that this page inherit
 * the current product's design system rather than invent its own.
 * Full-bleed to the true viewport edges (-mx-5 -mt-6 cancels the page
 * wrapper's own px-5/pt-6), with the teal panel's top corners rounded at
 * the same 12px radius EditorialHero uses for its own full-bleed teal
 * section -- the rounded notch reveals the page's own background behind
 * it, the same mechanism EditorialHero's rounded-b-[12px] already uses,
 * not a new card wrapped around the hero. Title and description only --
 * no eyebrow, no date/location/status chips, no CTA; those belong to the
 * Act Snapshot that follows this hero in a later pass.
 */
export function ActDetailHero({
  heroImageUrl,
  title,
  description,
}: {
  heroImageUrl: string | null;
  title: string;
  description: string;
}) {
  return (
    <div className="-mx-5 -mt-6">
      <ActHeroImage src={heroImageUrl} alt={title} />
      <ActHeroContent title={title} description={description} />
    </div>
  );
}
