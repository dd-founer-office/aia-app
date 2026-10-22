"use client";

/**
 * Kinetic Typography Reel — Phase 1 Proof of Concept
 * ----------------------------------------------------------------------------
 * Isolated prototype, not wired into PublishingWorkspace.tsx or
 * KuralHeroCanvas.tsx. It proves three things end to end: animated Tamil
 * typography stays legible in motion, the full 12.5s timeline previews and
 * replays consistently, and the SAME canvas can be recorded to a playable
 * video file in-browser -- all using the existing Canvas2D + next/font
 * approach, no new dependency.
 *
 * Export records via canvas.captureStream() + MediaRecorder, in whichever
 * format the browser actually reports supporting (checked with
 * MediaRecorder.isTypeSupported, same pattern components/capture/
 * MissionCamera.tsx already uses elsewhere in this app) -- the real format
 * is always shown to the user rather than assumed, since most Chromium
 * browsers report "video/webm", not "video/mp4".
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { drawKineticReelFrame } from "@/lib/kural-publishing/kinetic-reel-poc/renderer";
import { KINETIC_REEL_DURATION_SEC, KINETIC_REEL_STAGES } from "@/lib/kural-publishing/kinetic-reel-poc/script";
// Read-only reuse of the SAME font-resolution helper every production
// template already uses (reads --font-tamil-sans/--font-tamil-serif off
// the document, with the same fallback convention) -- does not modify
// KuralHeroCanvas.tsx, just imports its one pure, side-effect-free utility
// so this isolated prototype doesn't duplicate that fallback-chain logic.
import { resolveAllFonts } from "@/components/kural-publishing/KuralHeroCanvas";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const TAMIL_FALLBACK = "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif";
const TAMIL_SERIF_FALLBACK = "'Noto Serif Tamil','Tamil Sangam MN','Tamil MN',serif";

type ExportState = "idle" | "recording" | "done" | "error";

interface ExportInfo {
  mimeType: string;
  sizeBytes: number;
  filename: string;
}

function stageAt(elapsedSec: number) {
  return (
    KINETIC_REEL_STAGES.find((s) => elapsedSec >= s.startSec && elapsedSec < s.endSec) ??
    KINETIC_REEL_STAGES[KINETIC_REEL_STAGES.length - 1]
  );
}

export default function KineticReelPrototype() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tamilFontRef = useRef<string>(TAMIL_FALLBACK);
  const tamilSerifFontRef = useRef<string>(TAMIL_SERIF_FALLBACK);
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
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawKineticReelFrame(ctx, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      elapsedSec: sec,
      tamilFont: tamilFontRef.current,
      tamilSerifFont: tamilSerifFontRef.current,
    });
    setElapsedSec(sec);
  }, []);

  // Wait for the Tamil web fonts (already loaded app-wide via
  // app/layout.tsx's next/font/google setup) before the first paint or
  // any export -- same convention KuralHeroCanvas.tsx uses.
  useEffect(() => {
    mountedRef.current = true;
    document.fonts.ready
      .then(() => {
        if (!mountedRef.current) return;
        const fonts = resolveAllFonts();
        tamilFontRef.current = fonts.tamilFont;
        tamilSerifFontRef.current = fonts.tamilSerifFont;
        setFontsReady(true);
        renderAt(0);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        tamilFontRef.current = TAMIL_FALLBACK;
        tamilSerifFontRef.current = TAMIL_SERIF_FALLBACK;
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
    // renderAt is stable (useCallback, no deps) -- fine to omit here.
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
    const resumeFrom = elapsedSec >= KINETIC_REEL_DURATION_SEC ? 0 : elapsedSec;
    startTsRef.current = performance.now() - resumeFrom * 1000;
    setIsPlaying(true);

    const tick = () => {
      const elapsed = Math.min((performance.now() - startTsRef.current) / 1000, KINETIC_REEL_DURATION_SEC);
      renderAt(elapsed);
      if (elapsed >= KINETIC_REEL_DURATION_SEC) {
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
    // Defer so the reset frame (t=0) actually paints before playback
    // starts advancing again.
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
      const filename = `kinetic-reel-poc.${ext}`;
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

    // Drives the same deterministic render function used for preview, for
    // the full duration plus a short buffer -- guards against rAF/recorder
    // timing drift clipping the final hold frame.
    const startTs = performance.now();
    const bufferMs = 200;
    const exportTick = () => {
      const elapsedMs = performance.now() - startTs;
      renderAt(Math.min(elapsedMs / 1000, KINETIC_REEL_DURATION_SEC));
      if (elapsedMs >= KINETIC_REEL_DURATION_SEC * 1000 + bufferMs) {
        rafIdRef.current = null;
        if (recorder.state !== "inactive") recorder.stop();
        return;
      }
      rafIdRef.current = requestAnimationFrame(exportTick);
    };
    rafIdRef.current = requestAnimationFrame(exportTick);
  }, [fontsReady, exportState, stopRaf, renderAt]);

  const stage = stageAt(elapsedSec);
  const progressPct = Math.min(100, (elapsedSec / KINETIC_REEL_DURATION_SEC) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 24, minHeight: "100vh", background: "#1b1816", color: "#f3efe8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Kinetic Typography Reel — Phase 1 Prototype</h1>
        <p style={{ fontSize: 13, opacity: 0.65, margin: "4px 0 0" }}>
          Isolated proof of concept — not part of the production Asset Generator.
        </p>
      </div>

      <div style={{ width: "min(340px, 86vw)", aspectRatio: "9 / 16", borderRadius: 12, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          aria-label="Kinetic typography Reel preview"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      {!fontsReady && <p style={{ fontSize: 13, opacity: 0.75 }}>Loading Tamil fonts…</p>}

      <div style={{ width: "min(340px, 86vw)" }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "#C1702E", transition: "width 60ms linear" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          <span>{elapsedSec.toFixed(1)}s / {KINETIC_REEL_DURATION_SEC}s</span>
          <span>{stage.label}</span>
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
