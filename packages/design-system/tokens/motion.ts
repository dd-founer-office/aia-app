/**
 * AiA Design Tokens — Motion
 * Source: AiA Visual Constitution v1.0 §12.
 * Golden rule: no bounce, no spring, no confetti, no flashy transitions.
 */

export const duration = {
  fast: "150ms",
  base: "250ms",
  slow: "300ms",
} as const;

export const easing = {
  standard: "ease-out",
} as const;

/**
 * Explicitly excluded — do not add these even if requested downstream:
 * spring physics, bounce curves, confetti/particle effects.
 */
