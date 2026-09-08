/**
 * Daily Aathichoodi Series — Content Engine
 * ----------------------------------------------------------------------------
 * The one place Content -> Theme -> generated framing comes together for a
 * given episode. No AI/LLM call exists anywhere in this app (confirmed by a
 * full-repo audit before building this) -- every other content-generation
 * flow here is deterministic (typed fields -> canvas render), so this
 * engine follows the same pattern: real, working, rule-based composition
 * from tagged data pools, not a prompt to a model. It is intentionally
 * isolated in its own module so a real LLM-backed version could later
 * replace composeEpisode's internals alone, without touching canon.ts, the
 * renderers, or the UI.
 *
 * Locked slide framework (founder-approved, Episode 1 is the benchmark):
 *   1. STOP              -> hook (hooks.ts, theme-preference-driven)
 *   2. UNDERSTAND         -> understanding (understanding.ts: opener + the
 *                            episode's own meaning + a theme-rooted "what
 *                            this builds in a child" clause)
 *   3. SEE IT IN FAMILY LIFE -> familyAngle (scenarios.ts: one concrete,
 *                            ordinary family moment, never a generic
 *                            statement)
 *   4. PRACTICE THE VALUE TODAY -> todayAction (actions.ts: one small,
 *                            concrete, doable-today behaviour)
 *   5. CARRY IT FORWARD + AiA -> aiaConnection (voice.ts: paraphrases of
 *                            ONE consistent idea, "wisdom becomes
 *                            meaningful when it becomes action") + cta
 *
 * A canon entry's own `curated` fields (see canon.ts), when present, are
 * used verbatim for familyAngle/todayAction/childLesson/aiaConnection/
 * understanding/recommendedCta -- an editor already made that call
 * deliberately. Every other episode is composed live from the theme pools
 * with anti-repetition history (history-store.ts) so consistency comes
 * from STRUCTURE (the five-slide framework, the tone, the hook-preference
 * logic) rather than from repeating the same wording episode after episode.
 * Slide 1's hook is ALWAYS chosen by theme preference (see hooks.ts) --
 * even curated episodes don't hardcode it, since the hook is about which
 * question fits the emotional lesson, not editorial prose.
 *
 * `verified` reflects the canon entry's own flag (Tamil text confidence),
 * never invented per-episode.
 */

import { AATHICHOODI_CANON, getCanonEntry, type AathichoodiCanonEntry } from "./canon";
import { themeLabel, type ThemeId } from "./themes";
import { pickHook } from "./hooks";
import { selectScenario } from "./scenarios";
import { selectAction } from "./actions";
import { selectChildLesson, selectAiaConnection } from "./voice";
import { composeUnderstanding } from "./understanding";
import { classifyCta, type CtaSelection } from "./cta";
import {
  clampRecent,
  type SeriesHistory,
} from "./history-store";

export type AathichoodiFormat = "carousel" | "static";

export interface ComposedEpisode {
  episodeNumber: number;
  totalEpisodes: number;
  tamilText: string;
  transliteration: string;
  simpleMeaning: string;
  understanding: string;
  primaryTheme: ThemeId;
  themeLabel: string;
  hook: string;
  familyAngle: string;
  childLesson: string;
  todayAction: string;
  aiaConnection: string;
  distantDevotionConnection?: string;
  cta: CtaSelection;
  recommendedFormat: AathichoodiFormat;
  verified: boolean;
}

/** STATIC is recommended only for short, emotionally-anchored lines --
 *  everything else defaults to CAROUSEL, per the brief. */
export function recommendFormat(entry: AathichoodiCanonEntry): AathichoodiFormat {
  const wordCount = entry.tamilText.trim().split(/\s+/).length;
  const emotionalThemes: readonly ThemeId[] = ["family", "gratitude", "devotion"];
  if (wordCount <= 2 && emotionalThemes.includes(entry.primaryTheme)) return "static";
  return "carousel";
}

export interface ComposeResult {
  episode: ComposedEpisode;
  nextHistory: SeriesHistory;
}

export function composeEpisode(
  episodeNumber: number,
  history: SeriesHistory
): ComposeResult | null {
  const entry = getCanonEntry(episodeNumber);
  if (!entry) return null;

  const theme = entry.primaryTheme;
  const curated = entry.curated;

  // Slide 1's hook is always theme-preference-driven (see hooks.ts) --
  // deliberate per the emotional lesson, not random, and not something
  // curated episodes override with hand-written prose.
  const hook = pickHook(theme, history.recentHookIds);

  const scenario = curated
    ? { id: "curated", text: curated.familyAngle }
    : selectScenario(theme, episodeNumber, history.recentScenarioIds);
  const action = curated
    ? { id: "curated", text: curated.todayAction }
    : selectAction(theme, episodeNumber, history.recentActionIds);
  const childLesson = curated
    ? { id: "curated", text: curated.childLesson }
    : selectChildLesson(theme, episodeNumber, history.recentChildLessonIds);
  const aiaConnection = curated
    ? { id: "curated", text: curated.aiaConnection }
    : selectAiaConnection(episodeNumber, history.recentAiaConnectionIds);
  const understanding = curated?.understanding
    ? { text: curated.understanding, openerId: "curated", reframingId: "curated" }
    : composeUnderstanding(
        theme,
        episodeNumber,
        entry.simpleMeaning,
        history.recentUnderstandingOpenerIds,
        history.recentReframingIds
      );
  const cta = classifyCta(
    theme,
    entry.simpleMeaning,
    history.recentCtaTypes as CtaSelection["type"][],
    curated?.recommendedCta
  );

  const episode: ComposedEpisode = {
    episodeNumber: entry.episodeNumber,
    totalEpisodes: AATHICHOODI_CANON.length,
    tamilText: entry.tamilText,
    transliteration: entry.transliteration,
    simpleMeaning: entry.simpleMeaning,
    understanding: understanding.text,
    primaryTheme: theme,
    themeLabel: themeLabel(theme),
    hook: hook.text,
    familyAngle: scenario.text,
    childLesson: childLesson.text,
    todayAction: action.text,
    aiaConnection: aiaConnection.text,
    distantDevotionConnection: curated?.distantDevotionConnection,
    cta,
    recommendedFormat: recommendFormat(entry),
    verified: entry.verified,
  };

  const nextHistory: SeriesHistory = {
    lastEpisodeNumber: episodeNumber,
    recentHookIds: clampRecent([...history.recentHookIds, hook.id]),
    recentScenarioIds: clampRecent([...history.recentScenarioIds, scenario.id]),
    recentActionIds: clampRecent([...history.recentActionIds, action.id]),
    recentChildLessonIds: clampRecent([...history.recentChildLessonIds, childLesson.id]),
    recentAiaConnectionIds: clampRecent([...history.recentAiaConnectionIds, aiaConnection.id]),
    recentCtaTypes: clampRecent([...history.recentCtaTypes, cta.type]),
    recentUnderstandingOpenerIds: clampRecent([...history.recentUnderstandingOpenerIds, understanding.openerId]),
    recentReframingIds: clampRecent([...history.recentReframingIds, understanding.reframingId]),
  };

  return { episode, nextHistory };
}

export function nextEpisodeNumber(lastEpisodeNumber: number): number {
  if (lastEpisodeNumber <= 0) return 1;
  if (lastEpisodeNumber >= AATHICHOODI_CANON.length) return 1; // series loops after the final episode
  return lastEpisodeNumber + 1;
}
