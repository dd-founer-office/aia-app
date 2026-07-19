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
import { getMissionTemplate } from "@/lib/mission-templates";
import type { CQIReading, CapturedEvidence, EvidenceRequirement } from "@/types/mission-camera";

interface MissionCameraProps {
  missionId: string;
}

const ANALYSIS_SAMPLE_SIZE = 64;

export function MissionCamera({ missionId }: MissionCameraProps) {
  const router = useRouter();
  const template = getMissionTemplate(missionId);

  const [requirements, setRequirements] = useState<EvidenceRequirement[]>(() =>
    template ? template.requirements.map((r, i) => ({ ...r, status: i === 0 ? "active" : "pending" })) : []
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
