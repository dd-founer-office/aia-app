"use client";

/**
 * PublishingWorkspace — MVP
 * ----------------------------------------------------------------------------
 * Smallest workable internal tool for today's Issue #25 publish, per the
 * one-day MVP brief. Local component state only -- no persistence, no
 * database, no API route. Isolated from the rest of the Contributor App:
 * this file imports nothing from app/ or components/ outside its own
 * kural-publishing/ folder.
 */

import { useCallback, useRef, useState } from "react";
import KuralHeroCanvas, { CANVAS_WIDTH, CANVAS_HEIGHT } from "./KuralHeroCanvas";
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFieldChange = useCallback((key: ContentField, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = useCallback(() => {
    setGeneration((g) => g + 1);
  }, []);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(content);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [content]);

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
            className="rounded-[var(--radius-button)] border border-[var(--color-primary)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--color-primary)]"
          >
            Download PNG
          </button>
        </div>
      </section>

      <section className="flex-1">
        <p className="mb-2 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Preview — exports at exactly {CANVAS_WIDTH}×{CANVAS_HEIGHT}px
        </p>
        <div className="mx-auto max-w-4xl">
          <KuralHeroCanvas
            content={content}
            generation={generation}
            onCanvasReady={handleCanvasReady}
          />
        </div>
      </section>
    </div>
  );
}
