"use client";

/**
 * PublishingWorkspace — Distant Devotion Asset Generator
 * ----------------------------------------------------------------------------
 * Content -> Content Type -> Template -> Output Format -> Asset, per the
 * Asset Generator brief. Local component state only -- no persistence, no
 * database, no API route. Isolated from the rest of the Contributor App:
 * this file imports nothing from app/ or components/ outside its own
 * kural-publishing/ folder.
 *
 * Content Type selector offers six entries (Aathichoodi, Thirukkural, Kural
 * Koorum Aram, Tamil Learning, Announcement, Custom) but only two templates
 * back them -- see lib/kural-publishing/content-types.ts. "Thirukkural" and
 * "Kural Koorum Aram" both route to the original, untouched "kka" template
 * and share ONE KuralPublishingContent state (kuralContent below) -- per
 * that registry's own doc comment, this is the same content offered under
 * two selector entries, not two separate implementations, so switching
 * between them never resets the fields. The remaining four content types
 * all route to the "aathichoodi" template and share ONE AathichoodiContent
 * state (aathichoodiContent below), reset to that content type's own
 * defaults every time the content type changes among them.
 *
 * Multiple Asset Outputs (lib/kural-publishing/KuralHeroCanvas.tsx's
 * ASSET_FORMATS registry, filtered per template by formatsForTemplate) can
 * be selected at once via checkboxes plus a Select All toggle. "Generate
 * Selected Assets" renders every selected format through
 * renderAssetForExport and lists the results in the Generated Assets
 * section below, each with its own thumbnail, pixel dimensions, filename,
 * and Download PNG button, plus one Download All that triggers each item's
 * download in sequence (no ZIP/archive -- out of MVP scope, sequential
 * downloads are fine). The live preview above it always shows exactly one
 * format at a time, switched with the preview tabs (one per selected
 * format), and keeps re-rendering live as fields change (KuralHeroCanvas's
 * own effect), same as before.
 *
 * The original Kural Koorum Aram field set, its default content, and its
 * export filename convention (kural-koorum-aram-issue-{issue}-kural-
 * {kural}-{format.id}.png) are unchanged from the MVP -- see
 * buildKuralFilename. A parallel, analogous convention covers the
 * Aathichoodi-family content types -- see buildAathichoodiFilename.
 *
 * Final MVP art direction pass adds logo loading: attempts to load the
 * canonical asset from KKA_LOGO_PATH. If it isn't there yet, the load
 * simply fails and no logo draws -- no placeholder, no generated mark, per
 * the standing rule. The moment the real file exists at that path, it
 * appears in both the preview and every export with no further code change.
 */

import { useCallback, useEffect, useState } from "react";
import KuralHeroCanvas, {
  KKA_LOGO_PATH,
  ASSET_FORMATS,
  formatsForTemplate,
  renderAssetForExport,
  renderAathichoodiCarouselAssetForExport,
  type AssetFormat,
  type AssetContent,
} from "./KuralHeroCanvas";
import {
  DEFAULT_KURAL_200_CONTENT,
  deriveIssueNumber,
  type KuralPublishingContent,
} from "@/lib/kural-publishing/kural200-state";
import {
  CONTENT_TYPES,
  getContentType,
  defaultAathichoodiContentFor,
  fieldLabelsFor,
  type ContentTypeId,
  type TemplateId,
  type AathichoodiContent,
} from "@/lib/kural-publishing/content-types";
import { TOTAL_EPISODES } from "@/lib/kural-publishing/aathichoodi/canon";
import {
  composeEpisode,
  nextEpisodeNumber,
  type AathichoodiFormat,
  type ComposedEpisode,
} from "@/lib/kural-publishing/aathichoodi/content-engine";
import {
  loadHistory,
  saveHistory,
  EMPTY_HISTORY,
  type SeriesHistory,
} from "@/lib/kural-publishing/aathichoodi/history-store";
import { runQualityChecks } from "@/lib/kural-publishing/aathichoodi/quality-check";
import { generateCaption } from "@/lib/kural-publishing/aathichoodi/caption";
import {
  CAROUSEL_SLIDE_COUNT,
  SLIDE_LABELS,
} from "@/lib/kural-publishing/aathichoodi-carousel-renderer";

type ContentField = keyof KuralPublishingContent;

interface FieldConfig {
  key: ContentField;
  label: string;
  tamil?: boolean;
}

const FIELDS: readonly FieldConfig[] = [
  { key: "issue", label: "Issue" },
  { key: "series", label: "Series" },
  { key: "kuralNumber", label: "Kural Number" },
  { key: "tamilLine1", label: "Tamil Line 1", tamil: true },
  { key: "tamilLine2", label: "Tamil Line 2", tamil: true },
  { key: "englishLine1", label: "English Line 1" },
  { key: "englishLine2", label: "English Line 2" },
];

type AathichoodiField = keyof AathichoodiContent;

interface AathichoodiFieldConfig {
  key: AathichoodiField;
  tamil?: boolean;
  multiline?: boolean;
}

const AATHICHOODI_FIELDS: readonly AathichoodiFieldConfig[] = [
  { key: "letter", tamil: true },
  { key: "tamilLine", tamil: true },
  { key: "easyReading" },
  { key: "meaning", multiline: true },
  { key: "english" },
  { key: "series" },
];

/** Unchanged from the original MVP. */
function buildKuralFilename(
  content: KuralPublishingContent,
  format: AssetFormat
): string {
  const issue = deriveIssueNumber(content.issue);
  const kural = content.kuralNumber.trim().replace(/[^a-zA-Z0-9]+/g, "") || "0";
  return `kural-koorum-aram-issue-${issue}-kural-${kural}-${format.id}.png`;
}

function slugify(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "untitled";
}

function buildAathichoodiFilename(
  contentTypeId: ContentTypeId,
  content: AathichoodiContent,
  format: AssetFormat
): string {
  const slug = slugify(content.letter || content.series || contentTypeId);
  return `${contentTypeId}-${slug}-${format.id}.png`;
}

function buildFilename(
  contentTypeId: ContentTypeId,
  template: TemplateId,
  kuralContent: KuralPublishingContent,
  aathichoodiContent: AathichoodiContent,
  format: AssetFormat
): string {
  return template === "kka"
    ? buildKuralFilename(kuralContent, format)
    : buildAathichoodiFilename(contentTypeId, aathichoodiContent, format);
}

function buildSeriesStaticFilename(episode: ComposedEpisode, format: AssetFormat): string {
  return `aathichoodi-ep${String(episode.episodeNumber).padStart(3, "0")}-static-${format.id}.png`;
}

function buildSeriesCarouselFilename(
  episode: ComposedEpisode,
  slideIndex: number,
  format: AssetFormat
): string {
  return `aathichoodi-ep${String(episode.episodeNumber).padStart(3, "0")}-slide${slideIndex + 1}-${format.id}.png`;
}

/** Maps a composed series episode into the existing AathichoodiContent
 *  shape so the Static format can reuse the untouched single-card
 *  renderer/template exactly as-is -- no new render code needed for
 *  Static. Per the brief's own Static spec (Aathichoodi -> short
 *  interpretation -> emotional statement -> AiA signature). */
function seriesEpisodeToStaticContent(episode: ComposedEpisode): AathichoodiContent {
  return {
    letter: `Episode ${episode.episodeNumber}`,
    tamilLine: episode.tamilText,
    easyReading: episode.transliteration,
    meaning: episode.simpleMeaning,
    english: episode.childLesson,
    series: `Aathichoodi Series · ${episode.episodeNumber} of ${episode.totalEpisodes}`,
  };
}

interface GeneratedAsset {
  formatId: string;
  label: string;
  width: number;
  height: number;
  url: string;
  filename: string;
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function PublishingWorkspace() {
  const [contentTypeId, setContentTypeId] = useState<ContentTypeId>("kka");
  const [kuralContent, setKuralContent] = useState<KuralPublishingContent>(
    DEFAULT_KURAL_200_CONTENT
  );
  const [aathichoodiContent, setAathichoodiContent] =
    useState<AathichoodiContent>(defaultAathichoodiContentFor("aathichoodi"));
  const [generation, setGeneration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>(() => {
    const formats = formatsForTemplate(getContentType("kka").template);
    return formats[0] ? [formats[0].id] : [];
  });
  const [activePreviewFormatId, setActivePreviewFormatId] = useState<
    string | null
  >(() => {
    const formats = formatsForTemplate(getContentType("kka").template);
    return formats[0]?.id ?? null;
  });
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);

  // Daily Aathichoodi Series state. Isolated to its own block since every
  // other content type above is unaffected by it.
  const [episodeNumberInput, setEpisodeNumberInput] = useState(1);
  const [seriesFormat, setSeriesFormat] = useState<AathichoodiFormat>("carousel");
  const [composedEpisode, setComposedEpisode] = useState<ComposedEpisode | null>(null);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [seriesHistory, setSeriesHistory] = useState<SeriesHistory>(() => loadHistory());

  const contentTypeConfig = getContentType(contentTypeId);
  const template = contentTypeConfig.template;
  const isSeriesType = contentTypeId === "aathichoodi-series";
  const effectiveTemplate: TemplateId = isSeriesType
    ? seriesFormat === "static"
      ? "aathichoodi"
      : "aathichoodi-carousel"
    : template;
  const availableFormats = formatsForTemplate(effectiveTemplate);

  // A pure, cheap fallback so the preview always has a valid episode to
  // render during the brief one-render gap between switching to this
  // content type and the compose-on-switch state update below landing.
  const displayEpisode: ComposedEpisode | null =
    composedEpisode ?? (isSeriesType ? composeEpisode(1, EMPTY_HISTORY)?.episode ?? null : null);

  const content: AssetContent = isSeriesType
    ? seriesFormat === "static"
      ? displayEpisode
        ? seriesEpisodeToStaticContent(displayEpisode)
        : defaultAathichoodiContentFor("aathichoodi")
      : displayEpisode ?? (composeEpisode(1, EMPTY_HISTORY)?.episode as ComposedEpisode)
    : template === "kka"
      ? kuralContent
      : aathichoodiContent;

  // Derived-state resets, computed during render rather than in an effect --
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  // Each block compares against its own "previous value" state and, only on
  // a genuine change, both records the new previous value and adjusts the
  // dependent state in the same pass -- the sanctioned alternative to
  // setState-in-effect for state that must stay in sync with other state.

  // Reset the aathichoodi-family content to that content type's own
  // defaults whenever the content type changes among them. The kka-family
  // content (kuralContent) deliberately never resets this way -- Thirukkural
  // and Kural Koorum Aram are the same content under two selector entries.
  const [prevContentTypeId, setPrevContentTypeId] = useState(contentTypeId);
  if (contentTypeId !== prevContentTypeId) {
    setPrevContentTypeId(contentTypeId);
    if (template === "aathichoodi") {
      setAathichoodiContent(defaultAathichoodiContentFor(contentTypeId));
    }
    if (isSeriesType && !composedEpisode) {
      const result = composeEpisode(episodeNumberInput, seriesHistory);
      if (result) {
        setComposedEpisode(result.episode);
        setQualityWarnings(runQualityChecks(result.episode, seriesHistory).warnings);
        setSeriesFormat(result.episode.recommendedFormat);
        setSeriesHistory(result.nextHistory);
        saveHistory(result.nextHistory);
      }
    }
  }

  // Default the asset-output selection and preview tab to this template's
  // master format whenever the template changes (switching, e.g., from a
  // "kka" content type to an "aathichoodi" one swaps the whole format list).
  const [prevTemplate, setPrevTemplate] = useState(template);
  if (template !== prevTemplate) {
    setPrevTemplate(template);
    const defaultId = availableFormats[0]?.id ?? null;
    setSelectedFormatIds(defaultId ? [defaultId] : []);
    setActivePreviewFormatId(defaultId);
  }

  // Keep the active preview tab valid as the selection changes (e.g. the
  // user unchecks the format that's currently shown in the preview).
  const [prevSelectedFormatIds, setPrevSelectedFormatIds] =
    useState(selectedFormatIds);
  if (selectedFormatIds !== prevSelectedFormatIds) {
    setPrevSelectedFormatIds(selectedFormatIds);
    if (
      activePreviewFormatId &&
      !selectedFormatIds.includes(activePreviewFormatId)
    ) {
      setActivePreviewFormatId(selectedFormatIds[0] ?? null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLogoImage(img);
    };
    img.onerror = () => {
      // Asset not supplied yet -- expected until the canonical file is
      // added at KKA_LOGO_PATH. No placeholder, no retry, no console noise.
    };
    img.src = KKA_LOGO_PATH;
    return () => {
      cancelled = true;
    };
  }, []);

  // Object URLs from a previous "Generate Selected Assets" run are revoked
  // the moment they're replaced (or the workspace unmounts) -- never leaked.
  useEffect(() => {
    return () => {
      generatedAssets.forEach((asset) => URL.revokeObjectURL(asset.url));
    };
  }, [generatedAssets]);

  const previewFormat =
    availableFormats.find((f) => f.id === activePreviewFormatId) ??
    availableFormats[0] ??
    ASSET_FORMATS[0];

  const handleKuralFieldChange = useCallback(
    (key: ContentField, value: string) => {
      setKuralContent((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAathichoodiFieldChange = useCallback(
    (key: AathichoodiField, value: string) => {
      setAathichoodiContent((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleFormatSelected = useCallback((id: string) => {
    setSelectedFormatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    setSelectedFormatIds((prev) =>
      prev.length === availableFormats.length
        ? []
        : availableFormats.map((f) => f.id)
    );
  }, [availableFormats]);

  const handleGenerateSelected = useCallback(async () => {
    const formats = availableFormats.filter((f) =>
      selectedFormatIds.includes(f.id)
    );
    if (formats.length === 0) return;
    if (isSeriesType && !composedEpisode) return;

    setGeneration((g) => g + 1);
    setIsGenerating(true);
    try {
      const results: GeneratedAsset[] = [];

      if (isSeriesType && effectiveTemplate === "aathichoodi-carousel" && composedEpisode) {
        for (const format of formats) {
          for (let slide = 0; slide < CAROUSEL_SLIDE_COUNT; slide++) {
            const blob = await renderAathichoodiCarouselAssetForExport(
              composedEpisode,
              slide,
              logoImage,
              format
            );
            if (!blob) continue;
            results.push({
              formatId: `${format.id}-slide${slide + 1}`,
              label: `${format.label} · ${SLIDE_LABELS[slide]}`,
              width: format.width,
              height: format.height,
              url: URL.createObjectURL(blob),
              filename: buildSeriesCarouselFilename(composedEpisode, slide, format),
            });
          }
        }
      } else {
        for (const format of formats) {
          const blob = await renderAssetForExport(
            effectiveTemplate,
            content,
            logoImage,
            format
          );
          if (!blob) continue;
          results.push({
            formatId: format.id,
            label: format.label,
            width: format.width,
            height: format.height,
            url: URL.createObjectURL(blob),
            filename:
              isSeriesType && composedEpisode
                ? buildSeriesStaticFilename(composedEpisode, format)
                : buildFilename(
                    contentTypeId,
                    template,
                    kuralContent,
                    aathichoodiContent,
                    format
                  ),
          });
        }
      }
      setGeneratedAssets(results);
    } finally {
      setIsGenerating(false);
    }
  }, [
    availableFormats,
    selectedFormatIds,
    isSeriesType,
    composedEpisode,
    effectiveTemplate,
    template,
    content,
    logoImage,
    contentTypeId,
    kuralContent,
    aathichoodiContent,
  ]);

  const handleLoadEpisode = useCallback(
    (targetEpisode: number) => {
      const clamped = Math.min(Math.max(1, targetEpisode), TOTAL_EPISODES);
      const result = composeEpisode(clamped, seriesHistory);
      if (!result) return;
      setComposedEpisode(result.episode);
      setQualityWarnings(runQualityChecks(result.episode, seriesHistory).warnings);
      setSeriesHistory(result.nextHistory);
      saveHistory(result.nextHistory);
      setEpisodeNumberInput(clamped);
      setActiveSlideIndex(0);
      setGeneratedAssets([]);
      setGeneration((g) => g + 1);
    },
    [seriesHistory]
  );

  const handleGenerateNextEpisode = useCallback(() => {
    handleLoadEpisode(nextEpisodeNumber(seriesHistory.lastEpisodeNumber));
  }, [handleLoadEpisode, seriesHistory.lastEpisodeNumber]);

  const handleCopyCaption = useCallback(() => {
    if (!composedEpisode) return;
    const caption = generateCaption(composedEpisode);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(caption).catch(() => {
        /* clipboard permission unavailable -- caption is still shown in the textarea for manual copy */
      });
    }
  }, [composedEpisode]);

  const handleDownloadAsset = useCallback((asset: GeneratedAsset) => {
    triggerDownload(asset.url, asset.filename);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    for (const asset of generatedAssets) {
      triggerDownload(asset.url, asset.filename);
      // Small stagger so browsers don't treat this as a single burst and
      // block later downloads -- no ZIP/archive, sequential is fine per
      // the brief.
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }, [generatedAssets]);

  const allSelected =
    availableFormats.length > 0 &&
    selectedFormatIds.length === availableFormats.length;
  const selectedFormats = availableFormats.filter((f) =>
    selectedFormatIds.includes(f.id)
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-6 px-5 py-8 lg:flex-row lg:gap-10 lg:px-10">
      <section className="w-full lg:w-[340px] lg:shrink-0">
        <p className="mb-1 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Internal Tool — not part of the Contributor App
        </p>
        <h1 className="mb-6 font-display text-xl text-[var(--color-foreground)]">
          Distant Devotion — Asset Generator
        </h1>

        <label className="mb-6 flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Content Type
          </span>
          <select
            value={contentTypeId}
            onChange={(e) =>
              setContentTypeId(e.target.value as ContentTypeId)
            }
            className="rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
          >
            {CONTENT_TYPES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {isSeriesType && displayEpisode ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Episode ({TOTAL_EPISODES} total)
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={TOTAL_EPISODES}
                  value={episodeNumberInput}
                  onChange={(e) => setEpisodeNumberInput(Number(e.target.value) || 1)}
                  className="w-20 rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => handleLoadEpisode(episodeNumberInput)}
                  className="flex-1 rounded-[var(--radius-button)] border border-[var(--color-primary)] px-3 py-2 text-xs font-medium text-[var(--color-primary)]"
                >
                  Load Episode
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerateNextEpisode}
                className="mt-1 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-[var(--color-primary-foreground)]"
              >
                Generate Next Episode →
              </button>
              <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
                Episode {displayEpisode.episodeNumber} · Theme: {displayEpisode.themeLabel}
                {!displayEpisode.verified ? " · ⚠ unverified line, check source" : ""}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Format {" "}
                <span className="normal-case text-[var(--color-muted-foreground)] opacity-70">
                  (recommended: {displayEpisode.recommendedFormat})
                </span>
              </span>
              <div className="flex gap-2">
                {(["carousel", "static"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSeriesFormat(fmt)}
                    className={`flex-1 rounded-[var(--radius-button)] border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      seriesFormat === fmt
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {qualityWarnings.length > 0 && (
              <div className="rounded-[var(--radius-photo)] border border-amber-300 bg-amber-50 p-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                  Quality Check Warnings
                </p>
                <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-amber-800">
                  {qualityWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  Caption
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="text-xs font-medium text-[var(--color-primary)]"
                >
                  Copy
                </button>
              </div>
              <textarea
                readOnly
                value={generateCaption(displayEpisode)}
                rows={6}
                className="rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-foreground)] outline-none"
              />
            </div>

            <div className="rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                CTA · {displayEpisode.cta.type.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-xs text-[var(--color-foreground)]">{displayEpisode.cta.copy}</p>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-4">
          {template === "kka"
            ? FIELDS.map((field) => (
                <label key={field.key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                    {field.label}
                  </span>
                  <input
                    type="text"
                    value={kuralContent[field.key]}
                    onChange={(e) =>
                      handleKuralFieldChange(field.key, e.target.value)
                    }
                    className={`rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] ${
                      field.tamil ? "font-tamil-sans" : ""
                    }`}
                  />
                </label>
              ))
            : AATHICHOODI_FIELDS.map((field) => {
                const label = fieldLabelsFor(contentTypeId)[field.key];
                return (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                      {label}
                    </span>
                    {field.multiline ? (
                      <textarea
                        value={aathichoodiContent[field.key]}
                        onChange={(e) =>
                          handleAathichoodiFieldChange(
                            field.key,
                            e.target.value
                          )
                        }
                        rows={3}
                        className="rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={aathichoodiContent[field.key]}
                        onChange={(e) =>
                          handleAathichoodiFieldChange(
                            field.key,
                            e.target.value
                          )
                        }
                        className={`rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] ${
                          field.tamil ? "font-tamil-sans" : ""
                        }`}
                      />
                    )}
                  </label>
                );
              })}
        </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Asset Outputs
            </span>
            <button
              type="button"
              onClick={handleSelectAllToggle}
              className="text-xs font-medium text-[var(--color-primary)]"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableFormats.map((f) => {
              const checked = selectedFormatIds.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-[var(--radius-button)] border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    checked
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFormatSelected(f.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block">{f.label}</span>
                    <span
                      className={`block text-[10px] opacity-70 ${
                        checked ? "" : "text-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {f.width}×{f.height}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGenerateSelected}
            disabled={isGenerating || selectedFormats.length === 0}
            className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-50"
          >
            {isGenerating ? "Generating…" : "Generate Selected Assets"}
          </button>
        </div>
      </section>

      <section className="flex-1">
        {selectedFormats.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFormats.map((f) => {
              const active = f.id === previewFormat.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActivePreviewFormatId(f.id)}
                  className={`rounded-[var(--radius-button)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
        {isSeriesType && effectiveTemplate === "aathichoodi-carousel" && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SLIDE_LABELS.map((label, index) => {
              const active = index === activeSlideIndex;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveSlideIndex(index)}
                  className={`rounded-[var(--radius-button)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
                  }`}
                >
                  {index + 1}. {label}
                </button>
              );
            })}
          </div>
        )}
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Preview — {previewFormat.label}, exports at exactly{" "}
          {previewFormat.width}×{previewFormat.height}px
        </p>
        <div
          className={`mx-auto ${
            previewFormat.width >= previewFormat.height
              ? "max-w-4xl"
              : "max-w-md"
          }`}
        >
          <KuralHeroCanvas
            template={effectiveTemplate}
            content={content}
            generation={generation}
            logoImage={logoImage}
            format={previewFormat}
            slideIndex={activeSlideIndex}
          />
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base text-[var(--color-foreground)]">
              Generated Assets
            </h2>
            {generatedAssets.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="rounded-[var(--radius-button)] border border-[var(--color-primary)] bg-transparent px-4 py-1.5 text-xs font-medium text-[var(--color-primary)]"
              >
                Download All
              </button>
            )}
          </div>
          {generatedAssets.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Select one or more Asset Outputs and click &quot;Generate
              Selected Assets&quot; to produce downloadable PNGs.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {generatedAssets.map((asset) => (
                <div
                  key={asset.formatId}
                  className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={`${asset.label} preview`}
                    className="w-full rounded-[var(--radius-photo)] border border-[var(--color-border)] object-contain"
                  />
                  <div>
                    <p className="text-xs font-medium text-[var(--color-foreground)]">
                      {asset.label}
                    </p>
                    <p className="text-[10px] text-[var(--color-muted-foreground)]">
                      {asset.width}×{asset.height}px
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadAsset(asset)}
                    className="rounded-[var(--radius-button)] border border-[var(--color-primary)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]"
                  >
                    Download PNG
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
