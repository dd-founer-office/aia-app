export type EvidenceCategory = "tree" | "temple" | "annadhanam" | "student" | "family";

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
  proofType: "execution" | "living_update";
  proofTypeLabel: string;
  photoUrl: string;
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
