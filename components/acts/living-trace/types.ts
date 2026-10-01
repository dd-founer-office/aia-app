export type EvidenceCategory = "tree" | "temple" | "annadhanam" | "student" | "family";
export type EvidenceMediaKind = "photo" | "video";

/**
 * Adaptive Trust Card data (Living Trace Constitution §4).
 * "map" -> mini map + full map expansion (Tree, Temple, Annadhanam).
 * "info" -> contextual info panel, no location reveal (Student -- school
 * info, never precise child location; extended to Family Support for
 * the same dignity/privacy reasons).
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

  // Chronological Storytelling (Sprint 1A refinement): every card is one
  // named Moment, not a generic "Execution Evidence" record. momentTitle
  // answers "what am I witnessing" (e.g. "School Kits Distributed");
  // narrative is one factual sentence describing what happened.
  momentTitle: string;
  narrative: string;

  captureDate: string;
  captureDateIso: string;
  captureTime: string;
  // Full-precision capture date/time, split for The Evidence section's
  // "WHEN IT HAPPENED" record -- e.g. "28 September 2026" and
  // "10:18:42 AM GMT+5:30". Derived straight from the stored capture_time
  // + capture_timezone columns (same source as captureDateTimeFull above),
  // never reconstructed or guessed.
  captureDateLong?: string;
  captureTimeWithOffset?: string;
  capturedBy: string;
  organization?: string;

  // landmark is the human-readable place shown on the back of the card
  // for map-kind trust data (e.g. "Sri Ranganathaswamy Temple"). Not
  // set for info-kind items (Student/Family) -- their back uses
  // trust.infoValue instead, same privacy rule as the Trust Card.
  landmark?: string;
  address?: string;
  placeName?: string;
  plusCode?: string;
  captureDateTimeFull?: string;
  gpsLat: number;
  gpsLng: number;
  gpsAccuracyMeters: number;

  approvedBy: string;
  approvedDate: string;

  trust: TrustCardData;
}
