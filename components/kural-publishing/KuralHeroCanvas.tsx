"use client";

/**
 * KuralHeroCanvas — Distant Devotion Asset Generator
 * ----------------------------------------------------------------------------
 * Originally MVP-scoped to the Kural Koorum Aram landscape publication only;
 * now the shared preview/export canvas for the Asset Generator's two
 * templates ("kka" -> publishing-renderer.ts, unchanged; "aathichoodi" ->
 * aathichoodi-renderer.ts, new). Dispatch is by `template` prop -- content
 * shape is validated by the caller (PublishingWorkspace), not here.
 *
 * Renders into a backing canvas sized to the selected ASSET_FORMAT, displayed
 * responsively via CSS (width: 100%, height: auto) so the preview scales to
 * fit the workspace without ever changing the actual export resolution.
 *
 * Deliberately NOT the Living Field's LivingFieldEngine/requestAnimationFrame
 * loop -- this draws exactly once per (content, generation, debug, format)
 * change and then stops. No animation.
 *
 * Font resolution mirrors components/field/LivingField.tsx's own approach
 * (read --font-tamil-sans / --font-sans from the document, re-render once
 * document.fonts settles) without importing that component -- concept reuse
 * only.
 *
 * `debugFormationLogic` is KKA-template-only (it overlays that renderer's
 * Formation Path structure) and is a no-op for the Aathichoodi template.
 * Download PNG never reads pixels off the live preview canvas -- it always
 * goes through the *ForExport helpers below, both of which force the debug
 * overlay off independent of whatever the on-screen toggle is set to.
 */

import { useEffect, useRef } from "react";
import {
  renderKuralPublishing,
} from "@/lib/kural-publishing/publishing-renderer";
import type { KuralPublishingContent } from "@/lib/kural-publishing/kural200-state";
import {
  renderAathichoodi,
  renderAathichoodiForExport,
} from "@/lib/kural-publishing/aathichoodi-renderer";
import {
  renderAathichoodiCarouselSlide,
  renderAathichoodiCarouselSlideForExport,
  type CarouselDesignOverrides,
  type CarouselHotspot,
} from "@/lib/kural-publishing/aathichoodi-carousel-renderer";
import {
  renderDistantDevotion,
  renderDistantDevotionForExport,
  renderDistantDevotionCarouselSlide,
  renderDistantDevotionCarouselSlideForExport,
  DD_CAROUSEL_SLIDE_COUNT,
} from "@/lib/kural-publishing/distant-devotion-renderer";
import {
  renderDistantDevotion6Sec,
  renderDistantDevotion6SecForExport,
  SIX_SECOND_EXPORT_FRAME,
} from "@/lib/kural-publishing/distant-devotion-6sec-renderer";
import type { DdComposedAsset } from "@/lib/kural-publishing/distant-devotion/types";
import type { SixSecondStory } from "@/lib/kural-publishing/distant-devotion-6sec-types";
import type { AathichoodiContent, TemplateId } from "@/lib/kural-publishing/content-types";
import type { ComposedEpisode } from "@/lib/kural-publishing/aathichoodi/content-engine";

export const CANVAS_WIDTH = 1648;
export const CANVAS_HEIGHT = 928;

export type AssetContent =
  | KuralPublishingContent
  | AathichoodiContent
  | ComposedEpisode
  | DdComposedAsset
  | SixSecondStory;

export { DD_CAROUSEL_SLIDE_COUNT };

/** GOLD MASTER asset-format registry. Real, standard dimensions for each
 *  platform, not guessed. `templates` says which template(s) each format is
 *  offered for -- PublishingWorkspace filters this list by the active
 *  content type's template so, e.g., "KKA Cover" never shows up while
 *  Aathichoodi content is selected. */
export interface AssetFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  /** Whether this format gets the wordmark/handle. The two "master" formats
   *  (KKA Cover, Aathichoodi Post) do not -- they are the original,
   *  un-branded design for each template, matching the original landscape
   *  format's founder-scoped behavior. Every social format does. */
  branding: boolean;
  templates: readonly TemplateId[];
}

export const ASSET_FORMATS: readonly AssetFormat[] = [
  { id: "kka-cover", label: "KKA Cover", width: CANVAS_WIDTH, height: CANVAS_HEIGHT, branding: false, templates: ["kka"] },
  // GOLD MASTER: primary Aathichoodi carousel format, explicit founder
  // direction -- Instagram's recommended 4:5 portrait carousel size, listed
  // first among aathichoodi-carousel's templates so formatsForTemplate
  // picks it as the default (never the 1:1 square below).
  { id: "aathichoodi-carousel-4x5", label: "Aathichoodi Carousel (4:5)", width: 1080, height: 1350, branding: true, templates: ["aathichoodi-carousel"] },
  // Distant Devotion's own carousel master format, listed first among its
  // templates for the same reason as above -- see formatsForTemplate.
  { id: "distant-devotion-carousel-4x5", label: "Distant Devotion Carousel (4:5)", width: 1080, height: 1350, branding: true, templates: ["distant-devotion-carousel"] },
  { id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel", "distant-devotion", "distant-devotion-carousel"] },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel", "distant-devotion", "distant-devotion-carousel"] },
  { id: "whatsapp-status", label: "WhatsApp Status", width: 1080, height: 1920, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel", "distant-devotion", "distant-devotion-carousel"] },
  { id: "facebook-post", label: "Facebook Post", width: 1200, height: 630, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel", "distant-devotion", "distant-devotion-carousel"] },
  { id: "aathichoodi-post", label: "Aathichoodi Post", width: 1080, height: 1080, branding: false, templates: ["aathichoodi"] },
  { id: "distant-devotion-single", label: "Distant Devotion (Single Image)", width: 1080, height: 1080, branding: false, templates: ["distant-devotion"] },
  // Distant Devotion — 6-Second Story's own dedicated format. Reuses the
  // exact dimensions already defined above for Instagram Story/WhatsApp
  // Status (no new aspect-ratio math needed) but as its own entry, scoped
  // only to this template, per the brief's "create a dedicated format
  // entry... do not alter existing format definitions unnecessarily."
  { id: "distant-devotion-6sec-story", label: "Distant Devotion — 6-Second Story (9:16)", width: 1080, height: 1920, branding: true, templates: ["distant-devotion-6sec"] },
];

/** Formats available for a given template, "KKA Cover"/original landscape
 *  always first for the "kka" template to preserve prior default behavior. */
export function formatsForTemplate(template: TemplateId): AssetFormat[] {
  return ASSET_FORMATS.filter((f) => f.templates.includes(template));
}

/** Back-compat alias: the original single-format-tool export name. */
export type ExportFormat = AssetFormat;

/** Real text supplied directly by the founder, not invented -- see the
 *  drawSocialBranding doc comment in publishing-renderer.ts. */
export const BRANDING_WORDMARK = "AiA — Aram in Action";
export const BRANDING_HANDLE = "aram_in_action";

/** Where the canonical Kural Koorum Aram logo is expected to live once
 *  supplied. Nothing in this file generates a fallback if it's missing --
 *  PublishingWorkspace's loader simply fails silently and no logo draws,
 *  per the standing rule against placeholder/generated marks. Used by the
 *  original "kka" template only -- a different sub-brand's ornate seal
 *  (circuit-pattern bronze seal with its own wordmark ring), wrong for a
 *  general "AiA" lockup, so it stays separate from AIA_KOLAM_MARK_PATH
 *  below. */
export const KKA_LOGO_PATH = "/brand/kural-koorum-aram-logo.png";

/** The actual AiA brand mark, used by the Aathichoodi Carousel's brand
 *  lockup. Per the standing rule, this is the real, official logo file
 *  supplied by the founder -- never approximated with text, never
 *  recolored or redrawn. */
export const AIA_KOLAM_MARK_PATH = "/brand/AiA.png";

/** Distant Devotion's own logo, kept fully separate from the KKA seal and
 *  the AiA kolam mark above -- same standing rule: if no real file exists
 *  at this path yet, the loader simply fails and no logo draws, never a
 *  generated placeholder. Wordmark/handle text below is a reasonable
 *  placeholder pending real founder-supplied brand copy (unlike
 *  BRANDING_WORDMARK above, which IS confirmed founder text) -- flagged
 *  here rather than silently presented as equally authoritative. */
export const DISTANT_DEVOTION_LOGO_PATH = "/brand/distant-devotion-logo.png";
export const DD_BRANDING_WORDMARK = "Distant Devotion";
export const DD_BRANDING_HANDLE = "distant_devotion";

/** 6-Second Story's own brand signature text -- locked copy from the brief,
 *  kept separate from DD_BRANDING_WORDMARK/HANDLE above since this format's
 *  renderer draws a wordmark + tagline pair, not a wordmark + @handle.
 *  Currently unused: the locked 4-phase spec defers the signature's
 *  position ("we will define its position separately later"), so neither
 *  the live preview nor PNG export passes these in yet. Left defined here,
 *  not deleted, for when that's specified. */
export const DD6SEC_BRANDING_WORDMARK = "DISTANT DEVOTION™";
export const DD6SEC_BRANDING_TAGLINE = "Connecting Hearts & Roots";

const TAMIL_FALLBACK =
  "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif";
const SANS_FALLBACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const TAMIL_SERIF_FALLBACK = "'Noto Serif Tamil','Tamil Sangam MN','Tamil MN',serif";
const SERIF_FALLBACK = "Georgia,'Times New Roman',serif";
const DISPLAY_FALLBACK = "Georgia,'Times New Roman',serif";
// Distant Devotion — 6-Second Story's locked typography (Cal Sans / Inter).
// --font-cal-sans is aliased to Inter in app/globals.css until a licensed
// Cal Sans file exists -- see distant-devotion-6sec-renderer.ts's doc
// comment. These fallback chains are deliberately plain system sans-serif,
// never DM Serif Display.
const CAL_SANS_FALLBACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const INTER_FALLBACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
// No safe cross-platform fallback exists for Brahmi -- if the web font
// hasn't loaded, glyphs render as tofu/boxes on most systems. Known, accepted
// limitation (see lib/living-field/glyphs.ts), KKA template only.
const BRAHMI_FALLBACK = "'Noto Sans Brahmi',sans-serif";

function resolveFont(cssVarName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVarName)
    .trim();
  return value.length > 0 ? `${value}, ${fallback}` : fallback;
}

function resolveAllFonts() {
  return {
    tamilFont: resolveFont("--font-tamil-sans", TAMIL_FALLBACK),
    sansFont: resolveFont("--font-sans", SANS_FALLBACK),
    tamilSerifFont: resolveFont("--font-tamil-serif", TAMIL_SERIF_FALLBACK),
    serifFont: resolveFont("--font-serif", SERIF_FALLBACK),
    brahmiFont: resolveFont("--font-brahmi", BRAHMI_FALLBACK),
    // DM Serif Display -- the app's own designated display serif (see
    // app/layout.tsx's --font-display), used only for the Aathichoodi
    // Carousel's Slide 5 editorial statement, per explicit founder
    // direction allowing "a very restrained serif...for a major closing
    // statement only." Already loaded app-wide; no new font added.
    displayFont: resolveFont("--font-display", DISPLAY_FALLBACK),
    // Distant Devotion — 6-Second Story only. See CAL_SANS_FALLBACK's doc
    // comment above for why --font-cal-sans isn't a real Cal Sans file yet.
    calSansFont: resolveFont("--font-cal-sans", CAL_SANS_FALLBACK),
    interFont: resolveFont("--font-inter", INTER_FALLBACK),
  };
}

interface KuralHeroCanvasProps {
  template: TemplateId;
  content: AssetContent;
  /** Bump to force a re-render even when content is byte-identical to the
   *  last render (the explicit "Generate / Refresh" button). */
  generation: number;
  /** Optional canonical KKA logo, once available. */
  logoImage?: HTMLImageElement | null;
  /** aathichoodi-carousel template (Slide 3, Family Situation) and
   *  distant-devotion-6sec template (its full-bleed hero photo): an
   *  optional user-supplied photo, loaded from the relevant upload control
   *  in the workspace sidebar. The two templates' uploads are backed by
   *  completely separate state/persistence in PublishingWorkspace -- this
   *  prop is just a generic "photo for templates that use one" slot.
   *  Ignored by every other template. */
  familyImage?: HTMLImageElement | null;
  /** INTERNAL, development-only. Live-preview only, KKA template only.
   *  Defaults to false. */
  debugFormationLogic?: boolean;
  /** Which asset format to render at. */
  format: AssetFormat;
  /** aathichoodi-carousel template only: which of the 5 slides to render
   *  (0-indexed). Ignored by every other template. Defaults to 0. */
  slideIndex?: number;
  /** aathichoodi-carousel template only: live design/text overrides for
   *  the editable design-controls panel. Ignored by every other template.
   *  Omit for the founder-approved default look. */
  carouselDesign?: CarouselDesignOverrides;
  /** aathichoodi-carousel template only: called after every repaint with
   *  the current slide's clickable hotspot regions, for the workspace's
   *  click-to-edit overlay. Ignored by every other template. */
  onCarouselHotspots?: (hotspots: CarouselHotspot[]) => void;
}

export default function KuralHeroCanvas({
  template,
  content,
  generation,
  logoImage,
  familyImage,
  debugFormationLogic = false,
  format,
  slideIndex = 0,
  carouselDesign,
  onCarouselHotspots,
}: KuralHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { width, height, branding } = format;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = (): void => {
      const fonts = resolveAllFonts();
      if (template === "kka") {
        renderKuralPublishing(ctx, {
          width,
          height,
          content: content as KuralPublishingContent,
          ...fonts,
          logoImage: logoImage ?? null,
          debugFormationLogic,
          brandingWordmark: branding ? BRANDING_WORDMARK : undefined,
          brandingHandle: branding ? BRANDING_HANDLE : undefined,
        });
      } else if (template === "aathichoodi-carousel") {
        const hotspots = renderAathichoodiCarouselSlide(ctx, {
          width,
          height,
          episode: content as ComposedEpisode,
          slideIndex,
          tamilSerifFont: fonts.tamilSerifFont,
          tamilFont: fonts.tamilFont,
          serifFont: fonts.serifFont,
          sansFont: fonts.sansFont,
          displayFont: fonts.displayFont,
          logoImage: logoImage ?? null,
          familyImage: familyImage ?? null,
          brandingWordmark: branding ? BRANDING_WORDMARK : undefined,
          brandingHandle: branding ? BRANDING_HANDLE : undefined,
          design: carouselDesign,
        });
        onCarouselHotspots?.(hotspots);
      } else if (template === "distant-devotion") {
        renderDistantDevotion(ctx, {
          width,
          height,
          asset: content as DdComposedAsset,
          tamilFont: fonts.tamilFont,
          sansFont: fonts.sansFont,
          serifFont: fonts.serifFont,
          logoImage: logoImage ?? null,
          brandingWordmark: branding ? DD_BRANDING_WORDMARK : undefined,
          brandingHandle: branding ? DD_BRANDING_HANDLE : undefined,
        });
      } else if (template === "distant-devotion-carousel") {
        renderDistantDevotionCarouselSlide(ctx, {
          width,
          height,
          asset: content as DdComposedAsset,
          slideIndex,
          tamilFont: fonts.tamilFont,
          sansFont: fonts.sansFont,
          serifFont: fonts.serifFont,
          logoImage: logoImage ?? null,
          brandingWordmark: branding ? DD_BRANDING_WORDMARK : undefined,
          brandingHandle: branding ? DD_BRANDING_HANDLE : undefined,
        });
      } else if (template === "distant-devotion-6sec") {
        // No-op here -- this template animates (MOMENT -> CURIOSITY ->
        // INSIGHT -> FEELING over a 6-second loop), so it's owned entirely
        // by the dedicated requestAnimationFrame effect below, not this
        // single-paint-then-stop effect every other template uses.
        return;
      } else {
        renderAathichoodi(ctx, {
          width,
          height,
          content: content as AathichoodiContent,
          tamilSerifFont: fonts.tamilSerifFont,
          tamilFont: fonts.tamilFont,
          serifFont: fonts.serifFont,
          sansFont: fonts.sansFont,
          logoImage: logoImage ?? null,
          brandingWordmark: branding ? BRANDING_WORDMARK : undefined,
          brandingHandle: branding ? BRANDING_HANDLE : undefined,
        });
      }
    };

    paint();

    let cancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) paint();
        })
        .catch(() => {
          /* fallback chain already in place */
        });
    }

    return () => {
      cancelled = true;
    };
  }, [template, content, generation, logoImage, familyImage, debugFormationLogic, width, height, branding, slideIndex, carouselDesign, onCarouselHotspots]);

  // distant-devotion-6sec only: a real requestAnimationFrame loop driving
  // the MOMENT -> CURIOSITY -> INSIGHT -> FEELING sequence, looping every
  // 6 seconds for a continuous live preview. Completely separate from the
  // single-paint effect above -- every other template is untouched by this
  // effect (it no-ops immediately for them) and this effect never runs the
  // static paint() function above. PNG export never reads this loop's
  // output; it always renders its own fresh canvas at a fixed frame (see
  // renderDistantDevotion6SecAssetForExport below).
  useEffect(() => {
    if (template !== "distant-devotion-6sec") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let cancelled = false;
    const startedAt = performance.now();

    const tick = (): void => {
      if (cancelled) return;
      const fonts = resolveAllFonts();
      const elapsedSeconds = (performance.now() - startedAt) / 1000;
      renderDistantDevotion6Sec(ctx, {
        width,
        height,
        story: content as SixSecondStory,
        calSansFont: fonts.calSansFont,
        interFont: fonts.interFont,
        tamilFont: fonts.tamilFont,
        visualImage: familyImage ?? null,
        elapsedSeconds,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [template, content, familyImage, width, height, generation]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-label="Distant Devotion asset preview"
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--color-border)",
      }}
    />
  );
}

/** Renders a fresh, fully independent canvas for PNG export -- always with
 *  debugFormationLogic: false (KKA template) regardless of the live
 *  preview's current toggle state. This is the ONLY function
 *  PublishingWorkspace's Download PNG button should call for the KKA
 *  template, precisely so the debug overlay can never appear in an exported
 *  file. Accepts the same logo image the preview is showing. */
export async function renderKuralPublishingForExport(
  content: KuralPublishingContent,
  logoImage: HTMLImageElement | null = null,
  format: AssetFormat
): Promise<Blob | null> {
  const { width, height, branding } = format;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* fallback chain already in place */
    }
  }

  renderKuralPublishing(ctx, {
    width,
    height,
    content,
    ...resolveAllFonts(),
    logoImage,
    debugFormationLogic: false,
    brandingWordmark: branding ? BRANDING_WORDMARK : undefined,
    brandingHandle: branding ? BRANDING_HANDLE : undefined,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/** Aathichoodi/generic-template counterpart to renderKuralPublishingForExport
 *  above. Thin wrapper around aathichoodi-renderer.ts's own export helper so
 *  PublishingWorkspace can call one dispatch point per template without
 *  re-resolving fonts itself. */
export async function renderAssetForExport(
  template: TemplateId,
  content: AssetContent,
  logoImage: HTMLImageElement | null,
  format: AssetFormat
): Promise<Blob | null> {
  if (template === "kka") {
    return renderKuralPublishingForExport(
      content as KuralPublishingContent,
      logoImage,
      format
    );
  }
  if (template === "distant-devotion") {
    const fonts = resolveAllFonts();
    return renderDistantDevotionForExport({
      width: format.width,
      height: format.height,
      asset: content as DdComposedAsset,
      tamilFont: fonts.tamilFont,
      sansFont: fonts.sansFont,
      serifFont: fonts.serifFont,
      logoImage,
      brandingWordmark: format.branding ? DD_BRANDING_WORDMARK : undefined,
      brandingHandle: format.branding ? DD_BRANDING_HANDLE : undefined,
    });
  }
  return renderAathichoodiForExport(
    content as AathichoodiContent,
    logoImage,
    format,
    resolveAllFonts(),
    format.branding ? BRANDING_WORDMARK : undefined,
    format.branding ? BRANDING_HANDLE : undefined
  );
}

/** Distant Devotion — 6-Second Story export counterpart. Its own dedicated
 *  function rather than a branch in the generic renderAssetForExport above,
 *  same reasoning as the carousel export helpers below: it needs an extra
 *  param (the uploaded photo) the generic signature doesn't carry. */
export async function renderDistantDevotion6SecAssetForExport(
  story: SixSecondStory,
  visualImage: HTMLImageElement | null,
  format: AssetFormat
): Promise<Blob | null> {
  const fonts = resolveAllFonts();
  // No video export exists in this app, so a static PNG has to pick one
  // moment -- SIX_SECOND_EXPORT_FRAME is the held FEELING state (both
  // story lines visible, hook long gone). Brand signature intentionally
  // omitted for now -- see distant-devotion-6sec-renderer.ts's doc comment.
  return renderDistantDevotion6SecForExport({
    width: format.width,
    height: format.height,
    story,
    calSansFont: fonts.calSansFont,
    interFont: fonts.interFont,
    tamilFont: fonts.tamilFont,
    visualImage,
    elapsedSeconds: SIX_SECOND_EXPORT_FRAME,
  });
}

/** Distant Devotion carousel export counterpart, same pattern as
 *  renderAathichoodiCarouselAssetForExport below -- takes an extra
 *  slideIndex the generic renderAssetForExport doesn't need. */
export async function renderDistantDevotionCarouselAssetForExport(
  asset: DdComposedAsset,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: AssetFormat
): Promise<Blob | null> {
  const fonts = resolveAllFonts();
  return renderDistantDevotionCarouselSlideForExport({
    width: format.width,
    height: format.height,
    asset,
    slideIndex,
    tamilFont: fonts.tamilFont,
    sansFont: fonts.sansFont,
    serifFont: fonts.serifFont,
    logoImage,
    brandingWordmark: format.branding ? DD_BRANDING_WORDMARK : undefined,
    brandingHandle: format.branding ? DD_BRANDING_HANDLE : undefined,
  });
}

/** Carousel-specific export counterpart -- takes an extra slideIndex the
 *  other *ForExport helpers don't need, so it's kept as its own function
 *  rather than overloading renderAssetForExport's signature. */
export async function renderAathichoodiCarouselAssetForExport(
  episode: ComposedEpisode,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: AssetFormat,
  carouselDesign?: CarouselDesignOverrides,
  familyImage?: HTMLImageElement | null
): Promise<Blob | null> {
  return renderAathichoodiCarouselSlideForExport(
    episode,
    slideIndex,
    logoImage,
    format,
    resolveAllFonts(),
    format.branding ? BRANDING_WORDMARK : undefined,
    format.branding ? BRANDING_HANDLE : undefined,
    carouselDesign,
    familyImage
  );
}
