/**
 * AiA Design Tokens — Colors
 * Extracted verbatim from app/globals.css (AiA Design Tokens — LOCKED v1.1).
 * Do not edit values here without updating globals.css first — this file
 * must always mirror the contributor app, which remains the visual source of truth.
 */

export const colors = {
  background: "#EFF4F2",
  card: "#FFFFFF",
  border: "#DCE2DF",
  foreground: "#2B2A26",
  mutedForeground: "#8A8678",

  primary: "#328D63",
  primaryDark: "#236345",
  primaryForeground: "#FFFFFF",

  success: "#328D63",
  pending: "#B8862A",
  error: "#B3433B",
  inactive: "#8A8678",

  badgeVerifiedBg: "#E6F2EC",
  badgePendingBg: "#F6ECDC",
  badgeErrorBg: "#F4E4E2",
  badgeInactiveBg: "#EFEDE6",

  skeleton: "#EDE8DD",
  photoPlaceholder: "#D9D4C6",
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Reminder from the Visual Constitution: colours communicate STATE, not CATEGORY.
 * success/pending/error/inactive map to verification & ops status only —
 * never to Cause (Education/Medical/Annadhanam/Environment).
 */
