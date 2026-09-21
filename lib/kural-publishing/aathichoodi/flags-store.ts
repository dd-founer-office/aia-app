/**
 * Daily Aathichoodi Series — Episode Content Flags
 * ----------------------------------------------------------------------------
 * "Flag this episode" lets the founder mark an episode whose CONTENT is
 * wrong (a meaning drift, a mismatched theme, anything factual -- not a
 * wording preference) for later review, without needing a developer in
 * the room right then. Same client-side-only pattern as every other store
 * in this tool (aathichoodi-carousel-design-store.ts, history-store.ts) --
 * no database wired up here, so this persists to localStorage only.
 *
 * A flag snapshots the episode's CURRENTLY COMPOSED content at the moment
 * it's flagged, rather than just the episode number. Recomposing later
 * (composeEpisode again) can land on different pool selections as history
 * advances, which would silently show different text than what was
 * actually flagged -- the snapshot is what makes "Copy for review" a
 * faithful, self-contained bug report instead of a moving target.
 *
 * This is deliberately NOT a fix mechanism -- flags only ever get
 * reviewed and resolved by editing canon.ts directly (see Episode 8's
 * curated block for the pattern), same as every other canonical
 * correction in this series. Flagging queues the review; it doesn't
 * change what renders.
 */

"use client";

export interface FlaggedEpisodeSnapshot {
  tamilText: string;
  transliteration: string;
  simpleMeaning: string;
  themeLabel: string;
  hook: string;
  understanding: string;
  familyAngle: string;
  todayAction: string;
  aiaConnection: string;
}

export interface FlaggedEpisode {
  episodeNumber: number;
  note: string;
  flaggedAt: string;
  snapshot: FlaggedEpisodeSnapshot;
}

const FLAGS_STORAGE_KEY = "aia-aathichoodi-flags-v1";

export function loadFlags(): FlaggedEpisode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FLAGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FlaggedEpisode[]) : [];
  } catch {
    return [];
  }
}

function saveFlags(flags: FlaggedEpisode[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* storage unavailable (private browsing, quota) -- flag just won't persist */
  }
}

/** Adds or replaces (by episode number) a flag, most-recent first. */
export function addFlag(
  flags: readonly FlaggedEpisode[],
  episodeNumber: number,
  note: string,
  snapshot: FlaggedEpisodeSnapshot
): FlaggedEpisode[] {
  const next = [
    { episodeNumber, note, flaggedAt: new Date().toISOString(), snapshot },
    ...flags.filter((f) => f.episodeNumber !== episodeNumber),
  ];
  saveFlags(next);
  return next;
}

export function removeFlag(flags: readonly FlaggedEpisode[], episodeNumber: number): FlaggedEpisode[] {
  const next = flags.filter((f) => f.episodeNumber !== episodeNumber);
  saveFlags(next);
  return next;
}

/** Plain-text block meant to be pasted directly into a message -- one
 *  episode's worth of context per flag, nothing the reader has to look
 *  up separately. */
export function formatFlagsForReview(flags: readonly FlaggedEpisode[]): string {
  if (flags.length === 0) return "No flagged episodes.";
  const sorted = [...flags].sort((a, b) => a.episodeNumber - b.episodeNumber);
  return sorted
    .map((f) => {
      const s = f.snapshot;
      return [
        `Episode ${f.episodeNumber} — flagged ${new Date(f.flaggedAt).toLocaleDateString()}`,
        `Issue: ${f.note || "(no note given)"}`,
        `Tamil: ${s.tamilText} (${s.transliteration})`,
        `Meaning: ${s.simpleMeaning}`,
        `Theme: ${s.themeLabel}`,
        `Hook: ${s.hook}`,
        `Understanding: ${s.understanding}`,
        `Family scenario: ${s.familyAngle}`,
        `Today's action: ${s.todayAction}`,
        `AiA connection: ${s.aiaConnection}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}
