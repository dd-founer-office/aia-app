/**
 * AiA Design Tokens — Z-Index
 * No layering scale exists in the contributor app (it doesn't need one —
 * no modals, drawers, or sidebar today). This scale is newly authored for
 * the Ops Portal specifically, not extracted from anywhere. Flagging that
 * explicitly since it's the one token file in this package that isn't
 * ported from an existing locked value.
 *
 * Ordering logic: persistent chrome sits low; transient overlays stack on
 * top of it in the order a user would expect them to interrupt each other.
 * Toasts sit highest since they're system-level and must stay visible even
 * over an open modal.
 */

export const zIndex = {
  base: 0,
  stickyHeader: 10,
  sidebar: 20,
  dropdown: 30,
  drawer: 40,
  modal: 50,
  tooltip: 60,
  toast: 70,
} as const;

export type ZIndexToken = keyof typeof zIndex;
