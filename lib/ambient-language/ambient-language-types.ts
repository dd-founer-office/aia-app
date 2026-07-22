/**
 * Ambient Language Layer — Types
 * ----------------------------------------------------------------------------
 * MVP scope, per spec: exactly these seven events, nothing else. No
 * personalization, no AI, no user history, no festivals yet.
 */

export type AmbientLanguageEvent =
  | "appLaunch"
  | "homeReady"
  | "treeMission"
  | "education"
  | "food"
  | "evidencePublished"
  | "kuralSection";

export interface NotifyEventOptions {
  /** Required for "kuralSection" only. The Ambient Language Layer must
   *  never invent Thirukkural content -- the actual verse text is already
   *  sourced elsewhere in the app from the approved FI-DB-003/KKA-series
   *  record (see the Home dashboard's Kural Koorum Aram card). The caller
   *  passes that same already-approved text through; this layer only
   *  segments and forwards it. */
  phrase?: string;
}
