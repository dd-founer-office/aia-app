import type { EvidenceCategory } from "@/components/acts/living-trace/types";

export type EvidenceRequirementStatus = "pending" | "active" | "complete";

export interface EvidenceRequirement {
  id: string;
  label: string;
  kind: "photo" | "video";
  durationSeconds?: number;
  status: EvidenceRequirementStatus;
}

export interface MissionTemplate {
  id: string;
  name: string;
  category: EvidenceCategory;
  requirements: Omit<EvidenceRequirement, "status">[];
}

export type CQIStatus = "ready" | "needs-improvement" | "not-ready";

export interface CQIReading {
  status: CQIStatus;
  brightness: number;
  sharpness: number;
  gpsAvailable: boolean;
  timestampAvailable: boolean;
  coachingMessage: string | null;
}

export interface CapturedEvidence {
  requirementId: string;
  mediaKind: "photo" | "video";
  blobUrl: string;
  posterBlobUrl?: string;
  capturedAtIso: string;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracyMeters: number | null;
  cqi: CQIReading;
}
