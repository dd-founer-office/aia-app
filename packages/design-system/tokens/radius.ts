/**
 * AiA Design Tokens — Radius
 * Source: app/globals.css. Card padding note ported from Card.tsx's own
 * comment: 20px is a deliberate named exception to the 8pt grid, not 16px.
 */

export const radius = {
  card: "16px",
  button: "9999px", // full pill — confirmed against the live CSS var, not the stale comment in Button.tsx
  photo: "12px",
} as const;

export type RadiusToken = keyof typeof radius;
