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
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  KKA_LOGO_PATH,
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

function buildFilename(content: KuralPublishingContent): string {
  const issue = deriveIssueNumber(content.issue);
  const kural = content.kuralNumber.trim().replace(/[^a-zA-Z0-9]+/g, "") || "0";
  return `kural-koorum-aram-issue-${issue}-kural-${kural}.png`;
}

export default function PublishingWorkspace() {
  const [content, setContent] = useState<KuralPublishingContent>(
    DEFAULT_KURAL_200_CONTENT
  );
  const [generation, setGeneration] = useState(0);
  const [showFormationLogic, setShowFormationLogic] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

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
      const blob = await renderKuralPublishingForExport(content, logoImage);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(content);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [content, logoImage]);

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
            {isExporting ? "Preparing PNG…" : "Download PNG"}
          </button>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showFormationLogic}
              onChange={(e) => setShowFormationLogic(e.target.checked)}
            />
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              Show Formation Logic (debug, preview only)
            </span>
          </label>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)] opacity-70">
            Never appears in the downloaded PNG.
          </p>
        </div>

        <p className="mt-4 text-xs text-[var(--color-muted-foreground)] opacity-70">
          Logo: {logoImage ? "loaded from " : "not yet supplied at "}
          <code>{KKA_LOGO_PATH}</code>
        </p>
      </section>

      <section className="flex-1">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Preview — exports at exactly {CANVAS_WIDTH}×{CANVAS_HEIGHT}px
        </p>
        <div className="mx-auto max-w-4xl">
          <KuralHeroCanvas
            content={content}
            generation={generation}
            logoImage={logoImage}
            debugFormationLogic={showFormationLogic}
          />
        </div>
      </section>
    </div>
  );
}
