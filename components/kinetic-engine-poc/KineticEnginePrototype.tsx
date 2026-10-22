"use client";

/**
 * Kinetic Typography Engine — Proof of Concept Player
 * ----------------------------------------------------------------------------
 * Isolated, not wired into PublishingWorkspace.tsx, KuralHeroCanvas.tsx, or
 * any of the five production templates. Demonstrates the REUSABLE engine
 * (lib/kural-publishing/kinetic-engine/) against the content-specific demo
 * script (lib/kural-publishing/kinetic-engine-poc/demo-script.ts) -- this
 * component itself contains no word text, timing, or mood logic; it only
 * drives drawKineticFrame(ctx, script, t) on a RAF loop and records the
 * same canvas via captureStream()+MediaRecorder already proven in the
 * Phase 1/2 kinetic-reel-poc.
 *
 * Noto Sans Tamil only -- no serif font is resolved or referenced here.
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { drawKineticFrame } from "@/lib/kural-publishing/kinetic-engine/renderer";
import type { KineticScript } from "@/lib/kural-publishing/kinetic-engine/types";
import { buildDemoScript, KINETIC_ENGINE_POC_DURATION_SEC } from "@/lib/kural-publishing/kinetic-engine-poc/demo-script";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const TAMIL_SANS_FALLBACK = "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif";

type ExportState = "idle" | "recording" | "done" | "error";

interface ExportInfo {
  mimeType: string;
  sizeBytes: number;
  filename: string;
}

export default function KineticEnginePrototype() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scriptRef = useRef<KineticScript | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mountedRef = useRef(true);

  const [fontsReady, setFontsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportInfo, setExportInfo] = useState<ExportInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const renderAt = useCallback((sec: number) => {
    const canvas = canvasRef.current;
    const script = scriptRef.current;
    if (!canvas || !script) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawKineticFrame(ctx, script, sec);
    setElapsedSec(sec);
  }, []);

  // Noto Sans Tamil ONLY -- no serif font is resolved here, per the
  // standing rule for this system.
  useEffect(() => {
    mountedRef.current = true;
    document.fonts.ready
      .then(() => {
        if (!mountedRef.current) return;
        const value = getComputedStyle(document.documentElement).getPropertyValue("--font-tamil-sans").trim();
        const fontFamily = value ? `${value}, ${TAMIL_SANS_FALLBACK}` : TAMIL_SANS_FALLBACK;
        scriptRef.current = buildDemoScript(fontFamily, CANVAS_WIDTH, CANVAS_HEIGHT);
        setFontsReady(true);
        renderAt(0);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        scriptRef.current = buildDemoScript(TAMIL_SANS_FALLBACK, CANVAS_WIDTH, CANVAS_HEIGHT);
        setFontsReady(true);
        renderAt(0);
      });
    return () => {
      mountedRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* already stopping */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (!fontsReady || exportState === "recording") return;
    const resumeFrom = elapsedSec >= KINETIC_ENGINE_POC_DURATION_SEC ? 0 : elapsedSec;
    startTsRef.current = performance.now() - resumeFrom * 1000;
    setIsPlaying(true);

    const tick = () => {
      const elapsed = Math.min((performance.now() - startTsRef.current) / 1000, KINETIC_ENGINE_POC_DURATION_SEC);
      renderAt(elapsed);
      if (elapsed >= KINETIC_ENGINE_POC_DURATION_SEC) {
        setIsPlaying(false);
        rafIdRef.current = null;
        return;
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, [fontsReady, exportState, elapsedSec, renderAt]);

  const pause = useCallback(() => {
    stopRaf();
    setIsPlaying(false);
  }, [stopRaf]);

  const replay = useCallback(() => {
    stopRaf();
    renderAt(0);
    requestAnimationFrame(() => play());
  }, [stopRaf, renderAt, play]);

  const reset = useCallback(() => {
    stopRaf();
    setIsPlaying(false);
    renderAt(0);
  }, [stopRaf, renderAt]);

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!fontsReady || !canvas || exportState === "recording") return;

    setErrorMessage(null);
    setExportInfo(null);

    if (typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      setExportState("error");
      setErrorMessage("This browser does not support canvas.captureStream() / MediaRecorder -- in-browser video export isn't available here.");
      return;
    }

    stopRaf();
    setIsPlaying(false);
    renderAt(0);

    const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      setExportState("error");
      setErrorMessage("No supported recording format was reported by this browser.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(30);
    } catch (err) {
      setExportState("error");
      setErrorMessage(`Could not capture the canvas as a video stream: ${String(err)}`);
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    } catch (err) {
      stream.getTracks().forEach((track) => track.stop());
      setExportState("error");
      setErrorMessage(`MediaRecorder could not start with ${mimeType}: ${String(err)}`);
      return;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = (ev) => {
      stream.getTracks().forEach((track) => track.stop());
      if (!mountedRef.current) return;
      setExportState("error");
      setErrorMessage(`Recording failed: ${String((ev as unknown as { error?: unknown }).error ?? ev)}`);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (!mountedRef.current) return;
      const actualMime = recorder.mimeType || mimeType;
      const blob = new Blob(chunks, { type: actualMime });
      if (blob.size === 0) {
        setExportState("error");
        setErrorMessage("The recorded file was empty -- nothing was captured.");
        return;
      }
      const ext = actualMime.includes("mp4") ? "mp4" : "webm";
      const filename = `kinetic-engine-poc.${ext}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportInfo({ mimeType: actualMime, sizeBytes: blob.size, filename });
      setExportState("done");
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    };

    mediaRecorderRef.current = recorder;
    setExportState("recording");
    recorder.start();

    const startTs = performance.now();
    const bufferMs = 200;
    const exportTick = () => {
      const elapsedMs = performance.now() - startTs;
      renderAt(Math.min(elapsedMs / 1000, KINETIC_ENGINE_POC_DURATION_SEC));
      if (elapsedMs >= KINETIC_ENGINE_POC_DURATION_SEC * 1000 + bufferMs) {
        rafIdRef.current = null;
        if (recorder.state !== "inactive") recorder.stop();
        return;
      }
      rafIdRef.current = requestAnimationFrame(exportTick);
    };
    rafIdRef.current = requestAnimationFrame(exportTick);
  }, [fontsReady, exportState, stopRaf, renderAt]);

  const progressPct = Math.min(100, (elapsedSec / KINETIC_ENGINE_POC_DURATION_SEC) * 100);
  const compositionLabel = elapsedSec < 5.5 ? "Composition A" : "Composition B";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, minHeight: "100vh", background: "#1b1816", color: "#f3efe8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Kinetic Typography Engine — Proof of Concept</h1>
        <p style={{ fontSize: 13, opacity: 0.65, margin: "4px 0 0" }}>
          Reusable, data-driven engine demo — not a Reel, not integrated into production.
        </p>
      </div>

      <div style={{ width: "min(340px, 86vw)", aspectRatio: "9 / 16", borderRadius: 12, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Kinetic typography engine preview"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      {!fontsReady && <p style={{ fontSize: 13, opacity: 0.75 }}>Loading Noto Sans Tamil…</p>}

      <div style={{ width: "min(340px, 86vw)" }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "#C1702E", transition: "width 60ms linear" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          <span>{elapsedSec.toFixed(1)}s / {KINETIC_ENGINE_POC_DURATION_SEC}s</span>
          <span>{compositionLabel}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={isPlaying ? pause : play} disabled={!fontsReady || exportState === "recording"} style={buttonStyle()}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={replay} disabled={!fontsReady || exportState === "recording"} style={buttonStyle()}>
          Replay
        </button>
        <button onClick={reset} disabled={!fontsReady || exportState === "recording"} style={buttonStyle()}>
          Reset
        </button>
        <button onClick={handleExport} disabled={!fontsReady || exportState === "recording"} style={buttonStyle(true)}>
          {exportState === "recording" ? "Recording…" : "Export Video"}
        </button>
      </div>

      <div style={{ width: "min(420px, 90vw)", fontSize: 13, textAlign: "center", minHeight: 20 }}>
        {exportState === "done" && exportInfo && (
          <p style={{ color: "#8fd19e" }}>
            Downloaded <strong>{exportInfo.filename}</strong> — recorded as <code>{exportInfo.mimeType}</code> ({(exportInfo.sizeBytes / 1024).toFixed(0)} KB).
          </p>
        )}
        {exportState === "error" && errorMessage && (
          <p style={{ color: "#e08a8a" }}>{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

function buttonStyle(primary = false): CSSProperties {
  return {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    border: primary ? "none" : "1px solid rgba(255,255,255,0.25)",
    background: primary ? "#7A1B26" : "transparent",
    color: "#f3efe8",
    cursor: "pointer",
  };
}
