"use client";

/**
 * PublishingWorkspace — MVP
 * ----------------------------------------------------------------------------
 * Smallest workable internal tool for today's Issue #25 publish, per the
 * one-day MVP brief. Local component state only -- no persistence, no
 * database, no API route. Isolated from the rest of the Contributor App:
 * this file imports nothing from app/ or components/ outside its own
 * kural-publishing/ folder.
 *
 * Visual Pass 05 adds a "Show Formation Logic" debug toggle. It only ever
 * affects the live preview (passed straight through to KuralHeroCanvas).
 * Download PNG deliberately does NOT read the live preview canvas -- it
 * calls renderKuralPublishingForExport, a fully independent render that
 * always forces the debug overlay off, so the toggle can never leak into
 * an exported file regardless of what's on screen when Download is clicked.
 *
 * Final MVP art direction pass adds logo loading: attempts to load the
 * canonical asset from KKA_LOGO_PATH. If it isn't there yet, the load
 * simply fails and no logo draws -- no placeholder, no generated mark, per
 * the standing rule. The moment the real file exists at that path, it
 * appears in both the preview and the export with no further code change.
 */

import { useCallback, useEffect, useState } from "react";
import KuralHeroCanvas, {
  KKA_LOGO_PATH,
  EXPORT_FORMATS,
  type ExportFormat,
  renderKuralPublishingForExport,
} from "./KuralHeroCanvas";
import {
  DEFAULT_KURAL_200_CONTENT,
  deriveIssueNumber,
  type KuralPublishingContent,
} from "@/lib/kural-publishing/kural200-state";

type ContentField = keyof KuralPublishingContent;

interface FieldConfig {
  key: ContentField;
  label: string;
  tamil?: boolean;
  multiline?: boolean;
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

function buildFilename(content: KuralPublishingContent, format: ExportFormat): string {
  const issue = deriveIssueNumber(content.issue);
  const kural = content.kuralNumber.trim().replace(/[^a-zA-Z0-9]+/g, "") || "0";
  return `kural-koorum-aram-issue-${issue}-kural-${kural}-${format.id}.png`;
}

export default function PublishingWorkspace() {
  const [content, setContent] = useState<KuralPublishingContent>(
    DEFAULT_KURAL_200_CONTENT
  );
  const [generation, setGeneration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<ExportFormat>(EXPORT_FORMATS[0]);

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

  const handleFieldChange = useCallback((key: ContentField, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback(() => {
    setGeneration((g) => g + 1);
  }, []);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      // Independent render, debug always forced off inside this helper --
      // never reads the (possibly debug-overlaid) live preview canvas.
      const blob = await renderKuralPublishingForExport(content, logoImage, format);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(content, format);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [content, logoImage, format]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-6 px-5 py-8 lg:flex-row lg:gap-10 lg:px-10">
      <section className="w-full lg:w-[340px] lg:shrink-0">
        <p className="mb-1 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Internal Tool — not part of the Contributor App
        </p>
        <h1 className="mb-6 font-display text-xl text-[var(--color-foreground)]">
          Kural Koorum Aram — Publishing
        </h1>

        <div className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                {field.label}
              </span>
              <input
                type="text"
                value={content[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className={`rounded-[var(--radius-photo)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)] ${
                  field.tamil ? "font-tamil-sans" : ""
                }`}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Export format
          </span>
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_FORMATS.map((f) => {
              const active = f.id === format.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`rounded-[var(--radius-button)] border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)]"
                  }`}
                >
                  <span className="block">{f.label}</span>
                  <span className={`block text-[10px] opacity-70 ${active ? "" : "text-[var(--color-muted-foreground)]"}`}>
                    {f.width}×{f.height}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-primary-foreground)]"
          >
            Generate / Refresh
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="rounded-[var(--radius-button)] border border-[var(--color-primary)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--color-primary)] disabled:opacity-50"
          >
            {isExporting ? "Preparing PNG…" : `Download PNG (${format.label})`}
          </button>
        </div>
      </section>

      <section className="flex-1">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Preview — {format.label}, exports at exactly {format.width}×{format.height}px
        </p>
        <div className={`mx-auto ${format.width >= format.height ? "max-w-4xl" : "max-w-md"}`}>
          <KuralHeroCanvas
            content={content}
            generation={generation}
            logoImage={logoImage}
            format={format}
          />
        </div>
      </section>
    </div>
  );
}
