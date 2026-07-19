import type { CQIReading, CQIStatus } from "@/types/mission-camera";

// Capture Quality Intelligence — heuristic, on-device implementation.
// There's no ML/object-detection model in this stack, so this analyzes
// brightness and a Laplacian-style edge-variance "sharpness" proxy from
// a downsampled canvas frame. Enough for real-time steady/dark/blurry
// coaching signal; swap for a real CV model when the platform is ready.
export function analyzeFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  let sum = 0;
  const gray = new Float32Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    gray[p] = g;
    sum += g;
  }
  const brightness = sum / gray.length;

  let varSum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width];
      varSum += lap * lap;
      count++;
    }
  }
  const sharpness = count ? varSum / count : 0;

  return { brightness, sharpness };
}

export function scoreCQI(params: {
  brightness: number;
  sharpness: number;
  gpsAvailable: boolean;
  timestampAvailable: boolean;
}): CQIReading {
  const { brightness, sharpness, gpsAvailable, timestampAvailable } = params;
  const issues: string[] = [];
  let status: CQIStatus = "ready";

  if (!gpsAvailable || !timestampAvailable) {
    status = "not-ready";
    if (!gpsAvailable) issues.push("GPS signal unavailable.");
    if (!timestampAvailable) issues.push("Timestamp unavailable.");
  }

  if (brightness < 40) {
    if (status !== "not-ready") status = "needs-improvement";
    issues.push("Improve lighting.");
  } else if (brightness > 235) {
    if (status !== "not-ready") status = "needs-improvement";
    issues.push("Scene is too bright.");
  }

  if (sharpness < 15) {
    if (status !== "not-ready") status = "needs-improvement";
    issues.push("Hold camera steady.");
  }

  return { status, brightness, sharpness, gpsAvailable, timestampAvailable, coachingMessage: issues[0] ?? null };
}
