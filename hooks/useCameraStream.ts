"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FacingMode = "environment" | "user";

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(
    async (mode: FacingMode) => {
      setError(null);
      setReady(false);
      stop();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as Record<string, unknown> | undefined;
        setTorchSupported(Boolean(caps && "torch" in caps));
        setZoomSupported(Boolean(caps && "zoom" in caps));
        setReady(true);
      } catch {
        setError("Camera access was denied or is unavailable on this device.");
      }
    },
    [stop]
  );

  useEffect(() => {
    start(facingMode);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    try {
      const next = !torchOn;
      // Torch isn't in the standard TS DOM lib constraint types yet.
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      // Silently no-op — control stays hidden via torchSupported when unavailable.
    }
  }, [torchOn, torchSupported]);

  const setZoom = useCallback(
    async (value: number) => {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track || !zoomSupported) return;
      try {
        await track.applyConstraints({ advanced: [{ zoom: value } as unknown as MediaTrackConstraintSet] });
      } catch {
        // Falls back to CSS scale in the caller when unsupported.
      }
    },
    [zoomSupported]
  );

  const captureFrame = useCallback((): { canvas: HTMLCanvasElement } | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { canvas };
  }, []);

  const getStream = useCallback(() => streamRef.current, []);

  return {
    videoRef,
    switchCamera,
    torchSupported,
    torchOn,
    toggleTorch,
    zoomSupported,
    setZoom,
    error,
    ready,
    captureFrame,
    getStream,
  };
}
