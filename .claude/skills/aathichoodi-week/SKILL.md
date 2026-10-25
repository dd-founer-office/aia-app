---
name: aathichoodi-week
description: Draft a week (default 7 consecutive episodes) of Daily Aathichoodi Series copy -- all 5 carousel slides plus the Instagram caption -- by running the real, deterministic content engine headlessly for human review. Use when the founder asks to "generate next week's Aathichoodi copy," "draft the weekly Aathichoodi batch," or names a starting episode number for the series.
---

# Aathichoodi Week

Drafts a week's worth of Daily Aathichoodi Series copy for the founder to review and approve, **before** any of it is treated as final or entered into `canon.ts` as curated content.

## What this skill does NOT do

- It does **not** invent content. Every word comes from `lib/kural-publishing/aathichoodi/content-engine.ts`'s real `composeEpisode()` function -- the exact same deterministic, pool-based engine the live Asset Generator UI (`/internal/kural-publishing`) uses. There is no LLM call anywhere in this path.
- It does **not** publish, export images, upload to Drive, or schedule anything. It only prints text to the console for review.
- It does **not** edit `canon.ts` or any other content file itself. Turning approved draft text into a `curated` block on a specific episode is a separate, deliberate follow-up edit a human asks for after reviewing the draft this skill produces.

## Steps

1. **Find the starting episode number.** If the founder gives one, use it. If not, ask -- do not guess at where last week's batch left off. There is no file in this repo that tracks "the last episode actually posted" (the live UI only keeps `lastEpisodeNumber` in that browser's own `localStorage`), so this must come from the person, not be inferred.
2. **Run the script:**
   ```
   npx tsx scripts/weekly-aathichoodi-copy.ts <startEpisode> [count]
   ```
   `count` defaults to 7 (one week, Monday-Sunday) if omitted. The script threads anti-repetition history from episode 1 up to the start episode (discarded, not printed) so the requested range's pool selections match what a real sequential run-through would have produced, then prints each episode's full 5-slide breakdown and caption.
3. **Present the full output in chat, unedited**, for the founder to review. Never summarize or truncate an episode's content when asking for approval -- past experience in this project is that an abbreviated "(unchanged)" placeholder gets explicitly corrected to "show the whole thing."
4. **Apply corrections as directed, then re-run.** If the founder flags a specific line (a tagline that doesn't fit, a CTA that reads generic, an Avvaiyar-naming gap), the right fix is almost always in the underlying pool file (`taglines.ts`, `understanding.ts`, `scenarios.ts`, `actions.ts`, `cta.ts`, etc.), not a one-off edit to that single episode's printed text -- a pool fix improves every future episode that draws from it, not just this week's. Only add a `curated` override in `canon.ts` for an episode-specific exception the founder explicitly wants locked to that one episode.
5. **Do not touch code based on the printed draft alone.** Per the established process for this project: show the corrected copy here first, let the founder finalize or approve it, and only then make matching changes to the generator (pool files) or to `canon.ts`.

## Voice notes (as of the last founder-reviewed alignment pass)

- Slide 1's tagline (`taglines.ts`) is a single curiosity-building line, not a template couplet ("X today. / Y tomorrow.") -- it should build toward Slide 2, not resolve the episode before the viewer swipes.
- Slide 2's opener (`understanding.ts`) should always name Avvaiyar explicitly; vary the phrasing, not whether she's named.
- Slide 3's family scenario (`scenarios.ts`) should land its point through the scene itself, not a mechanical tie-back phrase like "...is this Aathichoodi" or "...is exactly what today's line is about" bolted on at the end.
- Slide 5's CTA (`cta.ts`) should read as a genuine, theme-appropriate action (save/share/comment/try-today/reflect) -- `AIA_PARTICIPATION`/`DISTANT_DEVOTION` CTA types are deliberately gated behind real registry matches (`aia-initiatives.ts`/`distant-devotion-services.ts`) so the engine never fabricates a sales pitch when no genuine connection exists.

If the founder's feedback points at a voice issue these notes don't cover, fix the pool file and update this list in the same change -- this file should stay the living source of truth for the series' voice, not drift out of sync with the actual pools.
