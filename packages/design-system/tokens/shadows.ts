/**
 * AiA Design Tokens — Shadows
 * Source: confirmed decision — Ops Portal matches the contributor app exactly.
 * The live Card.tsx has no box-shadow; elevation is communicated by the
 * 1px border only. No shadow scale exists in the app, so none is invented here.
 */

export const shadow = {
  none: "none",
} as const;

/**
 * If a real need for elevation shadows comes up later in Ops (e.g. a modal
 * needing separation from a busy table view), that's a new design decision —
 * bring it back here rather than reusing this token file silently.
 */
