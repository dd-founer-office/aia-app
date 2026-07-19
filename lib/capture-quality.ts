import type { CQIReading, CQIStatus } from "@/types/mission-camera";

export interface FrameAnalysis {
  brightness: number;
  sharpness: number;
  centerBrightness: number;
  edgeBrightness: number;
  contrast: number;
  gray: Float32Array;
}

// Capture Quality Intelligence -- heuristic, on-device implementation.
// There's no ML/object-detection model in this stack, so this analyzes
// brightness, edge-variance sharpness, center-vs-edge brightness
// (backlighting), overall contrast (a rough framing/distance proxy),
// and frame-to-frame motion, all from downsampled canvas frames.
export function analyzeFrame(ctx: CanvasRenderingContext2D, width: number, height: number): FrameAnalysis {
  const { data } = ctx.getImageData(0, 0, width, height);
  const gray = new Float32Array(width * height);
  let sum = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    gray[p] = g;
    sum += g;
  }
  const brightness = sum / gray.length;

  // Contrast: standard deviation of brightness across the frame. Very low
  // contrast usually means the frame is dominated by one flat/blurry
  // surface -- a rough, low-confidence proxy for "too close."
  let varAccum = 0;
  for (let p = 0; p < gray.length; p++) {
    const d = gray[p] - brightness;
    varAccum += d * d;
  }
  const contrast = Math.sqrt(varAccum / gray.length);

  // Sharpness via Laplacian edge variance.
  let lapVarSum = 0;
  let lapCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width];
      lapVarSum += lap * lap;
      lapCount++;
    }
  }
  const sharpness = lapCount ? lapVarSum / lapCount : 0;

  // Backlighting: center region brightness vs. the surrounding ring.
  const cx0 = Math.floor(width * 0.35);
  const cx1 = Math.ceil(width * 0.65);
  const cy0 = Math.floor(height * 0.35);
  const cy1 = Math.ceil(height * 0.65);
  let centerSum = 0;
  let centerCount = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x];
      if (x >= cx0 && x < cx1 && y >= cy0 && y < cy1) {
        centerSum += v;
        centerCount++;
      } else {
        edgeSum += v;
        edgeCount++;
      }
    }
  }
  const centerBrightness = centerCount ? centerSum / centerCount : brightness;
  const edgeBrightness = edgeCount ? edgeSum / edgeCount : brightness;

  return { brightness, sharpness, centerBrightness, edgeBrightness, contrast, gray };
}

// Frame-to-frame motion estimate (mean absolute difference). Used to tell
// "blurry because you're moving" apart from "blurry because it's out of
// focus" -- same frames must be the same dimensions.
export function estimateMotion(prev: Float32Array | null, current: Float32Array): number {
  if (!prev || prev.length !== current.length) return 0;
  let diffSum = 0;
  for (let i = 0; i < current.length; i++) {
    diffSum += Math.abs(current[i] - prev[i]);
  }
  return diffSum / current.length;
}

export function scoreCQI(params: {
  brightness: number;
  sharpness: number;
  centerBrightness: number;
  edgeBrightness: number;
  contrast: number;
  motion: number;
  tiltDegrees: number | null;
  gpsAvailable: boolean;
  gpsAccuracyMeters: number | null;
  timestampAvailable: boolean;
}): CQIReading {
  const {
    brightness, sharpness, centerBrightness, edgeBrightness, contrast, motion,
    tiltDegrees, gpsAvailable, gpsAccuracyMeters, timestampAvailable,
  } = params;

  const issues: string[] = [];
  let status: CQIStatus = "ready";
  const downgrade = (next: CQIStatus) => {
    if (status !== "not-ready") status = next;
  };

  if (!gpsAvailable || !timestampAvailable) {
    status = "not-ready";
    if (!gpsAvailable) issues.push("GPS signal unavailable.");
    if (!timestampAvailable) issues.push("Timestamp unavailable.");
  }

  if (brightness < 40) {
    downgrade("needs-improvement");
    issues.push("Improve lighting.");
  } else if (brightness > 235) {
    downgrade("needs-improvement");
    issues.push("Scene is too bright.");
  }

  // Motion-aware steadiness: only blame hand-shake when the frame is both
  // soft AND actively changing between samples.
  if (sharpness < 15) {
    downgrade("needs-improvement");
    issues.push(motion > 6 ? "Hold camera steady." : "Move closer or refocus on the subject.");
  }

  if (centerBrightness < edgeBrightness - 35) {
    downgrade("needs-improvement");
    issues.push("Move so the light is behind you, not the subject.");
  }

  if (contrast < 12 && brightness > 40 && brightness < 235) {
    downgrade("needs-improvement");
    issues.push("Step back a little -- the frame looks too close.");
  }

  if (tiltDegrees !== null && Math.abs(tiltDegrees) > 8) {
    downgrade("needs-improvement");
    issues.push("Straighten the camera.");
  }

  if (gpsAvailable && gpsAccuracyMeters !== null && gpsAccuracyMeters > 50) {
    downgrade("needs-improvement");
    issues.push("Move toward an open area for a stronger GPS lock.");
  }

  return { status, brightness, sharpness, gpsAvailable, timestampAvailable, coachingMessage: issues[0] ?? null };
}
