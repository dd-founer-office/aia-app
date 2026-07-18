export type EvidenceCategory = "tree" | "temple" | "annadhanam" | "student" | "family";
export type EvidenceMediaKind = "photo" | "video";

/**
 * Adaptive Trust Card data (Living Trace Constitution §4).
 * "map" -> mini map + full map expansion (Tree, Temple, Annadhanam).
 * "info" -> contextual info panel, no location reveal (Student -- school
 * info, never precise child location; extended to Family Support for
 * the same dignity/privacy reasons, per explicit direction).
 */
export interface TrustCardData {
  kind: "map" | "info";
  verificationStatus: "verified" | "pending";
  locationLabel: string;
  lat?: number;
  lng?: number;
  infoLabel?: string;
  infoValue?: string;
}

export interface EvidenceTraceItem {
  id: string;
  actId: string;
  category: EvidenceCategory;
  mediaKind: EvidenceMediaKind;
  photoUrl: string; // photo: the image itself; video: poster frame
  videoUrl?: string; // required when mediaKind === "video"
  durationLabel?: string; // e.g. "0:14", video only
  proofType: "execution" | "living_update";
  proofTypeLabel: string;
  captureDate: string;
  captureDateIso: string;
  captureTime: string;
  capturedBy: string;
  gpsLat: number;
  gpsLng: number;
  gpsAccuracyMeters: number;
  device: string;
  approvedBy: string;
  approvedDate: string;
  trust: TrustCardData;
}
