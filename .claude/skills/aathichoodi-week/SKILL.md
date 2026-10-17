---
name: aathichoodi-week
description: Draft a week's worth of Aathichoodi Daily Series copy (all 5 slides + caption, for 7 consecutive episodes) for human review, by running the app's own deterministic content engine rather than writing new copy by hand. Use this whenever the user asks for "this week's copy," "next week's episodes," "a batch/week of Aathichoodi content," "draft the next N episodes," or wants to review upcoming Daily Series copy before it's published — even if they just say "give me next week's posts" or name a starting episode number. Only applies to the aia-app repo's Aathichoodi Daily Series (lib/kural-publishing/aathichoodi/) — not Distant Devotion, not Kural Koorum Aram, and not a request to write brand-new creative copy from scratch.
---

# Aathichoodi Weekly Copy Draft

## What this produces

A reviewable Markdown document covering N consecutive episodes (7 by
default — one per day) of the Daily Aathichoodi Series: every slide's copy
(hook, tagline, understanding, family situation, today's action, carry-it-
forward line, AiA connection, CTA) plus the Instagram caption, for each
episode.

**Nothing in the output is newly written by you.** The series' own content
engine (`lib/kural-publishing/aathichoodi/content-engine.ts`) is
deterministic and pool-based, not an LLM call — every line is either a
curated field an editor already hand-wrote for that specific episode
(`canon.ts`), or one entry from a themed pool of pre-written variations,
picked by an anti-repetition selector keyed to the episode number. Your
job here is to run that existing pipeline in batch and format the result
for review — not to compose, paraphrase, or improve any of the copy
yourself. If the output reads oddly, that's feedback for whoever curates
the canon/pools, not something to silently patch in the Markdown.

## How to run it

```
npx tsx scripts/weekly-aathichoodi-copy.ts <startEpisode> [count]
```

- `startEpisode` — the first episode number to include. Ask the user which
  episode comes next if they haven't said (e.g. "what was the last episode
  you published, or where should this week start?"). Don't guess — picking
  the wrong starting point produces a week nobody asked for.
- `count` — how many consecutive episodes, defaults to 7. The series wraps
  back to episode 1 after the last one (109 at last count), same as the
  live app's "Generate Next Episode" button, so a start near the end is
  fine.

Run it from the repo root. It prints Markdown to stdout — capture it
(e.g. redirect to a file, or just read the command's output) rather than
re-typing or summarizing it; the whole point is that every word already
comes verbatim from the real pipeline.

## What to do with the output

This is a **draft for a human to approve before anything is published** —
present it, don't auto-publish anything from it (this script has no write
access to the canon or to any publishing surface, so there's nothing to
accidentally publish, but don't tell the user it's final either). Then:

1. Show the content to the user — either inline in your response if it's
   short enough, or saved to a file they can open, following whatever this
   session's normal convention is for handing over a reviewable document.
2. Point out anything worth their attention while you're reading it over:
   - Any episode marked "no language category classified yet" in Slide 4 —
     that episode is showing a generic fallback heading instead of the
     Rethink/Ask/Try heading the other episodes get; flag that it should
     be classified (beliefs/practices/management) at some point.
   - Any episode the script reports it "could not compose" (ran past the
     canon's episode range in a way that shouldn't happen, or a missing
     entry) — a real data problem, not something to paper over.
3. Remind them (once, briefly, not every time) that this batch's repeat-
   avoidance only looks within this week, not against previous weeks —
   worth a quick skim against last week's draft, if they have one, before
   approving.

## If something looks wrong with the copy itself

If the user says a specific line is wrong, repetitive, or off-brand, that's
a canon/pool content problem, not a bug in this script. Point them at the
right place rather than hand-editing the Markdown output:

- A specific episode's Tamil text, meaning, or hand-authored fields →
  `lib/kural-publishing/aathichoodi/canon.ts`
- A generated field repeating too often or reading stale → the matching
  pool file (`hooks.ts`, `taglines.ts`, `scenarios.ts`, `actions.ts`,
  `voice.ts`, `understanding.ts`), or the anti-repetition window itself
  (`selection.ts`'s `RECENT_LIMIT`)
- The Slide 4 heading text → `SLIDE3_ACTION_HEADING_LABELS` in `canon.ts`

Editing those is a real code change to the shared content engine — treat it
with the same care as any other change to this codebase (read the
surrounding file's doc comments first, they explain a lot of prior
decisions), not something to rush through inside this skill's flow.
