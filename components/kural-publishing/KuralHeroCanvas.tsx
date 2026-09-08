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
} from "@/lib/kural-publishing/aathichoodi-carousel-renderer";
import type { AathichoodiContent, TemplateId } from "@/lib/kural-publishing/content-types";
import type { ComposedEpisode } from "@/lib/kural-publishing/aathichoodi/content-engine";

export const CANVAS_WIDTH = 1648;
export const CANVAS_HEIGHT = 928;

export type AssetContent = KuralPublishingContent | AathichoodiContent | ComposedEpisode;

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
  { id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel"] },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel"] },
  { id: "whatsapp-status", label: "WhatsApp Status", width: 1080, height: 1920, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel"] },
  { id: "facebook-post", label: "Facebook Post", width: 1200, height: 630, branding: true, templates: ["kka", "aathichoodi", "aathichoodi-carousel"] },
  { id: "aathichoodi-post", label: "Aathichoodi Post", width: 1080, height: 1080, branding: false, templates: ["aathichoodi"] },
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
 *  per the standing rule against placeholder/generated marks. */
export const KKA_LOGO_PATH = "/brand/kural-koorum-aram-logo.png";

const TAMIL_FALLBACK =
  "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif";
const SANS_FALLBACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const TAMIL_SERIF_FALLBACK = "'Noto Serif Tamil','Tamil Sangam MN','Tamil MN',serif";
const SERIF_FALLBACK = "Georgia,'Times New Roman',serif";
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
  /** INTERNAL, development-only. Live-preview only, KKA template only.
   *  Defaults to false. */
  debugFormationLogic?: boolean;
  /** Which asset format to render at. */
  format: AssetFormat;
  /** aathichoodi-carousel template only: which of the 5 slides to render
   *  (0-indexed). Ignored by every other template. Defaults to 0. */
  slideIndex?: number;
}

export default function KuralHeroCanvas({
  template,
  content,
  generation,
  logoImage,
  debugFormationLogic = false,
  format,
  slideIndex = 0,
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
        renderAathichoodiCarouselSlide(ctx, {
          width,
          height,
          episode: content as ComposedEpisode,
          slideIndex,
          tamilSerifFont: fonts.tamilSerifFont,
          tamilFont: fonts.tamilFont,
          serifFont: fonts.serifFont,
          sansFont: fonts.sansFont,
          logoImage: logoImage ?? null,
          brandingWordmark: branding ? BRANDING_WORDMARK : undefined,
          brandingHandle: branding ? BRANDING_HANDLE : undefined,
        });
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
  }, [template, content, generation, logoImage, debugFormationLogic, width, height, branding, slideIndex]);

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
  return renderAathichoodiForExport(
    content as AathichoodiContent,
    logoImage,
    format,
    resolveAllFonts(),
    format.branding ? BRANDING_WORDMARK : undefined,
    format.branding ? BRANDING_HANDLE : undefined
  );
}

/** Carousel-specific export counterpart -- takes an extra slideIndex the
 *  other *ForExport helpers don't need, so it's kept as its own function
 *  rather than overloading renderAssetForExport's signature. */
export async function renderAathichoodiCarouselAssetForExport(
  episode: ComposedEpisode,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: AssetFormat
): Promise<Blob | null> {
  return renderAathichoodiCarouselSlideForExport(
    episode,
    slideIndex,
    logoImage,
    format,
    resolveAllFonts(),
    format.branding ? BRANDING_WORDMARK : undefined,
    format.branding ? BRANDING_HANDLE : undefined
  );
}
