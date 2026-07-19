"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { MissionHeader } from "./MissionHeader";
import { CaptureProgressDots } from "./CaptureProgressDots";
import { EvidenceChecklist } from "./EvidenceChecklist";
import { CaptureQualityIndicator } from "./CaptureQualityIndicator";
import { SmartCoachingOverlay } from "./SmartCoachingOverlay";
import { MissionMetadataCollector } from "./MissionMetadataCollector";
import { MissionCameraControls } from "./MissionCameraControls";
import { CaptureReview } from "./CaptureReview";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { useCameraStream } from "@/hooks/useCameraStream";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { analyzeFrame, estimateMotion, scoreCQI } from "@/lib/capture-quality";
import { submitMissionEvidenceAction } from "@/lib/capture-actions";
import { getSupabasePublicClient } from "@/lib/supabase/client";
import type { CQIReading, CapturedEvidence, EvidenceRequirement, MissionTemplate } from "@/types/mission-camera";

interface MissionCameraProps {
  missionId: string;
  missionName: string;
  template: MissionTemplate;
}

const ANALYSIS_SAMPLE_SIZE = 64;

export function MissionCamera({ missionId, missionName, template }: MissionCameraProps) {
  const router = useRouter();

  const [requirements, setRequirements] = useState<EvidenceRequirement[]>(() =>
    template.requirements.map((r, i) => ({ ...r, status: i === 0 ? "active" : "pending" }))
  );
  const [captured, setCaptured] = useState<CapturedEvidence[]>([]);
  const [gridOn, setGridOn] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [cqi, setCqi] = useState<CQIReading | null>(null);
  const [reviewFrame, setReviewFrame] = useState<{ url: string; kind: "photo" | "video" } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordCountdown, setRecordCountdown] = useState<number | null>(null);
  const [focusRing, setFocusRing] = useState<{ x: number; y: number } | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [tiltDegrees, setTiltDegrees] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    videoRef,
    torchSupported,
    torchOn,
    toggleTorch,
    zoomSupported,
    setZoom: setHardwareZoom,
    switchCamera,
    ready,
    error,
    captureFrame,
    getStream,
  } = useCameraStream();
  const geo = useGeolocation();
  const orientation = useDeviceOrientation();

  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevGrayRef = useRef<Float32Array | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);

  const orientationRef = useRef({ supported: false, tiltDegrees: 0 });
  const geoRef = useRef({ available: false, accuracyMeters: null as number | null });

  useEffect(() => {
    orientationRef.current = { supported: orientation.supported, tiltDegrees: orientation.tiltDegrees };
    setTiltDegrees(orientation.tiltDegrees);
  }, [orientation.supported, orientation.tiltDegrees]);

  useEffect(() => {
    geoRef.current = { available: geo.available, accuracyMeters: geo.accuracyMeters };
  }, [geo.available, geo.accuracyMeters]);

  const activeRequirement = requirements.find((r) => r.status === "active") ?? null;
  const completedCount = requirements.filter((r) => r.status === "complete").length;
  const missionComplete = completedCount === template.requirements.length;

  useEffect(() => {
    if (!ready || reviewFrame) return;
    const canvas = analysisCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      canvas.width = ANALYSIS_SAMPLE_SIZE;
      canvas.height = ANALYSIS_SAMPLE_SIZE;
      ctx.drawImage(video, 0, 0, ANALYSIS_SAMPLE_SIZE, ANALYSIS_SAMPLE_SIZE);
      const analysis = analyzeFrame(ctx, ANALYSIS_SAMPLE_SIZE, ANALYSIS_SAMPLE_SIZE);
      const motion = estimateMotion(prevGrayRef.current, analysis.gray);
      prevGrayRef.current = analysis.gray;

      const { supported, tiltDegrees: tilt } = orientationRef.current;
      const { available: gpsAvailable, accuracyMeters } = geoRef.current;

      setCqi(
        scoreCQI({
          brightness: analysis.brightness,
          sharpness: analysis.sharpness,
          centerBrightness: analysis.centerBrightness,
          edgeBrightness: analysis.edgeBrightness,
          contrast: analysis.contrast,
          motion,
          tiltDegrees: supported ? tilt : null,
          gpsAvailable,
          gpsAccuracyMeters: accuracyMeters,
          timestampAvailable: true,
        })
      );
    }, 600);

    return () => clearInterval(interval);
  }, [ready, reviewFrame, videoRef]);

  function handleZoomSelect(value: number) {
    setZoom(value);
    if (zoomSupported) setHardwareZoom(value);
  }

  function handleTapFocus(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setFocusRing({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    window.setTimeout(() => setFocusRing(null), 600);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinchStartDistRef.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartZoomRef.current = zoom;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = dist / pinchStartDistRef.current;
      const next = Math.min(2, Math.max(0.5, pinchStartZoomRef.current * ratio));
      setZoom(Number(next.toFixed(2)));
      if (zoomSupported) setHardwareZoom(next);
    }
  }

  function handleCapture() {
    if (!activeRequirement) return;

    if (activeRequirement.kind === "photo") {
      const frame = captureFrame();
      if (!frame) return;
      const url = frame.canvas.toDataURL("image/jpeg", 0.9);
      setReviewFrame({ url, kind: "photo" });
      return;
    }

    const stream = getStream();
    if (!stream || recording) return;

    const mimeType = MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      setReviewFrame({ url: URL.createObjectURL(blob), kind: "video" });
      setRecording(false);
      setRecordCountdown(null);
    };

    recorder.start();
    setRecording(true);

    const duration = activeRequirement.durationSeconds ?? 15;
    setRecordCountdown(duration);
    const tick = setInterval(() => {
      setRecordCountdown((s) => (s !== null && s > 1 ? s - 1 : (clearInterval(tick), 0)));
    }, 1000);

    window.setTimeout(() => recorder.stop(), duration * 1000);
  }

  function handleRetake() {
    setReviewFrame(null);
  }

  function handleAccept() {
    if (!activeRequirement || !reviewFrame || !cqi) return;

    const evidence: CapturedEvidence = {
      requirementId: activeRequirement.id,
      mediaKind: activeRequirement.kind,
      blobUrl: reviewFrame.url,
      capturedAtIso: new Date().toISOString(),
      gpsLat: geo.lat,
      gpsLng: geo.lng,
      gpsAccuracyMeters: geo.accuracyMeters,
      cqi,
    };

    setCaptured((prev) => [...prev, evidence]);
    setRequirements((prev) => {
      const idx = prev.findIndex((r) => r.id === activeRequirement.id);
      return prev.map((r, i) => {
        if (i === idx) return { ...r, status: "complete" as const };
        if (i === idx + 1) return { ...r, status: "active" as const };
        return r;
      });
    });
    setReviewFrame(null);
  }

async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const supabase = getSupabasePublicClient();
      if (!supabase) throw new Error("Supabase is not configured.");

      const items = [];
      for (let i = 0; i < captured.length; i++) {
        const item = captured[i];
        const blob = await fetch(item.blobUrl).then((r) => r.blob());
        const ext = item.mediaKind === "video" ? "webm" : "jpg";
        const path = `${missionId}/${i + 1}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("mission-evidence")
          .upload(path, blob, { contentType: blob.type });
        if (uploadError) throw new Error(uploadError.message);

        const { data: publicUrlData } = supabase.storage.from("mission-evidence").getPublicUrl(path);

        items.push({
          photoUrl: publicUrlData.publicUrl,
          captureTime: item.capturedAtIso,
          gpsLat: item.gpsLat,
          gpsLng: item.gpsLng,
          gpsAccuracyMeters: item.gpsAccuracyMeters,
        });
      }

      await submitMissionEvidenceAction(missionId, items);
      setSubmitted(true);
    } catch {
      setSubmitError("Submission failed. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (missionComplete) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[var(--color-background)] px-6 text-center">
        <p className="font-display text-xl text-[var(--color-foreground)]">
          {submitted ? "Submitted for Review" : "Mission Complete"}
        </p>
        <p className="max-w-xs text-sm text-[var(--color-muted-foreground)]">
          {submitted
            ? `${captured.length} pieces of evidence have been submitted for ${missionName} and are now pending review.`
            : `${captured.length} pieces of evidence captured for ${missionName}. Submit them for review to move into the Living Trace.`}
        </p>
        {submitError && <p className="text-sm text-[var(--color-error)]">{submitError}</p>}
        {submitted ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-primary-foreground)]"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-3 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <canvas ref={analysisCanvasRef} className="hidden" aria-hidden="true" />

      <div
        className="relative flex-1 overflow-hidden"
        onPointerDown={handleTapFocus}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: zoom !== 1 && !zoomSupported ? `scale(${zoom})` : undefined }}
        />

        <div className="absolute left-0 right-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/50 to-transparent pb-6 pt-2">
          <MissionHeader missionName={missionName} />
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close Mission Camera"
            className="mr-4 mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
          >
            <X size={16} />
          </button>
        </div>

        {gridOn && (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/25" />
            ))}
          </div>
        )}

        {orientation.supported && (
          <div
            className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 transition-opacity duration-300 ease-out"
            style={{ opacity: Math.abs(tiltDegrees) > 4 ? 1 : 0 }}
          >
            <div
              className="h-[2px] w-8 rounded-full transition-transform duration-300 ease-out"
              style={{
                transform: `rotate(${tiltDegrees}deg)`,
                backgroundColor: Math.abs(tiltDegrees) < 2 ? "var(--color-success)" : "rgba(255,255,255,0.85)",
              }}
            />
          </div>
        )}

        {orientation.needsPermission && (
          <button
            type="button"
            onClick={orientation.requestPermission}
            className="absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white"
          >
            Enable Horizon Level
          </button>
        )}

        {focusRing && (
          <span
            className="pointer-events-none absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-opacity duration-300 ease-out"
            style={{ left: focusRing.x, top: focusRing.y }}
          />
        )}

        {cqi && !recording && <CaptureQualityIndicator status={cqi.status} />}
        {cqi && !recording && <SmartCoachingOverlay message={cqi.coachingMessage} />}
        <MissionMetadataCollector gpsAvailable={geo.available} />

        {recording && (
          <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-error)]" />
            Recording · {recordCountdown}s
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-white">
            {error}
          </div>
        )}

        {reviewFrame && cqi && (
          <CaptureReview
            previewUrl={reviewFrame.url}
            kind={reviewFrame.kind}
            cqi={cqi}
            onRetake={handleRetake}
            onAccept={handleAccept}
          />
        )}
      </div>

      {!reviewFrame && !recording && (
        <MissionCameraControls
          gridOn={gridOn}
          onToggleGrid={() => setGridOn((v) => !v)}
          torchSupported={torchSupported}
          torchOn={torchOn}
          onToggleTorch={toggleTorch}
          zoom={zoom}
          onSetZoom={handleZoomSelect}
          onSwitchCamera={switchCamera}
          onCapture={handleCapture}
          captureDisabled={!ready || !activeRequirement}
        />
      )}

      {!reviewFrame && !recording && (
        <CaptureProgressDots requirements={requirements} onOpenChecklist={() => setChecklistOpen(true)} />
      )}

      <BottomSheet open={checklistOpen} onClose={() => setChecklistOpen(false)}>
        <p className="mb-1 text-xs text-[var(--color-muted-foreground)]">Current Mission</p>
        <p className="mb-3 font-display text-base text-[var(--color-foreground)]">{missionName}</p>
        <EvidenceChecklist requirements={requirements} />
      </BottomSheet>
    </div>
  );
}
