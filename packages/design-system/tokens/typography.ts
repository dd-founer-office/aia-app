/**
 * AiA Design Tokens — Typography (font families only)
 * Source: app/layout.tsx next/font/google configuration.
 *
 * NOTE: this file intentionally does NOT define a size/weight scale yet.
 * The Visual Constitution says "keep the current typography exactly as
 * implemented — no changes," but the actual size/weight scale lives
 * scattered across component classNames, not in one locked spec. Auditing
 * that into a scale is Commit 2/3 work — flagging rather than inventing one.
 */

export const fontFamily = {
  sans: "var(--font-sans)", // DM Sans — body/UI, English
  display: "var(--font-display)", // DM Serif Display — wordmark/display, English
  tamilSans: "var(--font-tamil-sans)", // Noto Sans Tamil — Tamil UI text
  tamilSerif: "var(--font-tamil-serif)", // Noto Serif Tamil — Tamil display text
} as const;

export const fontWeight = {
  sans: [400, 500, 700], // DM Sans loaded weights
  display: [400], // DM Serif Display loaded weight
  tamilSans: [400, 500], // Noto Sans Tamil loaded weights
  tamilSerif: [400], // Noto Serif Tamil loaded weight
} as const;
