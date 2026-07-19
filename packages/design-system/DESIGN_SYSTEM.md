# AiA Design System

Reusable design tokens and components extracted from the AiA Contributor App,
for use by the Operations Portal (built in Emergent) and any future AiA surface.

**The contributor app remains the visual source of truth.** This package is a
mirror of it, not a parallel design authority. If the two ever disagree,
the app wins — update this package to match, not the other way around.

---

## Color Palette

Source: `app/globals.css` (AiA Design Tokens — LOCKED v1.1).

| Token | Value | Use |
|---|---|---|
| `background` | `#EFF4F2` | App background |
| `card` | `#FFFFFF` | Card surfaces |
| `border` | `#DCE2DF` | 1px borders |
| `foreground` | `#2B2A26` | Primary text |
| `mutedForeground` | `#8A8678` | Secondary text |
| `primary` | `#328D63` | Primary green |
| `primaryDark` | `#236345` | Links, dark-green text |
| `success` / `pending` / `error` / `inactive` | `#328D63` / `#B8862A` / `#B3433B` / `#8A8678` | **Status only** |
| `badge*Bg` | tinted backgrounds for each status | Badge fills |
| `skeleton` | `#EDE8DD` | Loading placeholder bars |
| `photoPlaceholder` | `#D9D4C6` | Image placeholder |

**Rule (Visual Constitution §3, non-negotiable):** colours communicate STATE, never CATEGORY. Never use status colors to distinguish Cause (Education/Medical/Annadhanam/Environment) or evidence type.

## Typography Scale

Font families only — see `tokens/typography.ts`. DM Sans (body), DM Serif Display (display/wordmark), Noto Sans/Serif Tamil (Tamil text). **No size/weight scale is locked yet** — sizes currently live inline per component, ported as-is. Don't invent a scale on top of this; audit real usage first if one is needed.

## Spacing Scale

8pt grid, with one confirmed named exception: **Card padding is 20px, not 16px** (per `Card.tsx`'s own comment, confirmed against the locked spec). No other spacing scale is locked — components in this package use their literal ported values, not a derived scale.

## Elevation Rules

**No box-shadow anywhere.** Confirmed decision: Ops Portal cards stay border-only, matching the app exactly. `tokens/shadows.ts` exists only to make that explicit — don't add shadow values without a new design decision.

## Radius Rules

| Token | Value |
|---|---|
| `card` | 16px |
| `button` | 9999px (full pill) |
| `photo` | 12px |

Note: a comment inside the app's own `Button.tsx` incorrectly states the radius should be 10px. The actual CSS variable is 9999px — that's what this package uses. Flagging so nobody "fixes" this package to match the wrong comment later.

## Motion Rules

150ms / 250ms / 300ms durations, `ease-out` only. **No spring, no bounce, no confetti** — Visual Constitution golden rule, applies everywhere including Ops.

## Z-Index Scale

Newly authored for this package — **no equivalent scale exists in the contributor app** (it doesn't need one). Confirmed scope: modals, drawers, sidebar, dropdowns, tooltips, toasts, sticky headers.

| Layer | Value |
|---|---|
| base | 0 |
| stickyHeader | 10 |
| sidebar | 20 |
| dropdown | 30 |
| drawer | 40 |
| modal | 50 |
| tooltip | 60 |
| toast | 70 |

## Component Usage

All components are real extractions from `aia-app/components/shared/`, ported to consume tokens via inline styles instead of the app's CSS custom properties, so they render correctly outside this repo (e.g. in Emergent, which has no access to `globals.css`).

| Component | Status |
|---|---|
| Button, Card, Badge, Chip | Ported as-is |
| ProgressIndicator, PhotoGallery | Ported as-is |
| IconBadge, ListRow, Skeleton, ScreenHeader, SectionHeader | Ported as-is |
| ExpandableText, BottomSheet | Ported as-is |
| EvidenceCard | Ported with one change: routing generalized from hardcoded `next/link` + `/acts/[id]` to a plain `href`/`onClick` prop, since this package has no router |

### Not included — and why

| Item | Reason |
|---|---|
| `BottomNavigation` | Contributor-app-specific: hardcoded 5-tab mobile routes and brand mark. Product OS specifies Ops Portal uses **left nav + module links**, a different pattern — porting this would invent a navigation model the spec doesn't call for. |
| `CauseCard`, `ChipCard` | Bound to the Cause domain object, which has no Ops Portal equivalent. |
| `Timeline` | Listed in the Frontend Architecture doc as planned, but never actually built (Journey/CA-012 is parked, so nothing needed it). Nothing to extract. |
| `Input`, `TextArea`, `Avatar`, `Modal`, `Drawer`, `Sidebar`, `Header`, `MapCard` | Don't exist anywhere in the contributor app. These are net-new components for Ops and need their own design pass — building them silently here would mean inventing UI, which is explicitly against how we work. |

## Do's and Don'ts

**Do:**
- Import tokens, not hex codes, in any new Ops component
- Treat this package as a mirror — re-sync it if the app's `globals.css` or `components/shared/` changes
- Flag any Ops-only need (new component, new token) before building it, the same way this whole extraction was flagged step by step

**Don't:**
- Add shadows, gradients, or bright colors — Visual Constitution applies to Ops too
- Use status colors for anything but status
- Add gamification, leaderboards, or competitive UI — same product-wide prohibition
- Treat a missing component in this package as permission to invent one from scratch — bring it back for a real design decision first
