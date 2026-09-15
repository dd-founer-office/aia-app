/**
 * Daily Aathichoodi Series — Caption Hashtags
 * ----------------------------------------------------------------------------
 * Exactly 3 hashtags per episode, per explicit founder direction: one fixed
 * brand tag (consistency/discoverability under the brand itself), one
 * theme-tagged tag (relevance to this specific episode, not generic), and
 * one broad reach tag rotated with anti-repetition so consecutive episodes
 * don't repeat the same broad tag back-to-back. Deterministic, same
 * pool + pickFresh pattern as hooks.ts/taglines.ts -- no invented
 * engagement-bait tags, just real, on-topic ones.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

const BRAND_HASHTAG = "#AramInAction";

const THEME_HASHTAGS: Record<ThemeId, string> = {
  character: "#CharacterBuilding",
  "self-control": "#TeachPatience",
  generosity: "#RaiseGivers",
  family: "#FamilyFirst",
  gratitude: "#GratefulKids",
  responsibility: "#TeachResponsibility",
  community: "#KindKids",
  devotion: "#MindfulParenting",
  speech: "#WordsMatter",
  education: "#LifelongLearning",
  honesty: "#RaiseHonestKids",
};

interface ReachHashtag extends Pickable {
  tag: string;
}

const REACH_HASHTAGS: readonly ReachHashtag[] = [
  { id: "reach-1", tag: "#ParentingTips" },
  { id: "reach-2", tag: "#PositiveParenting" },
  { id: "reach-3", tag: "#RaisingGoodHumans" },
  { id: "reach-4", tag: "#ValuesBasedParenting" },
  { id: "reach-5", tag: "#EverydayParenting" },
  { id: "reach-6", tag: "#TamilCulture" },
];

export function selectHashtags(
  theme: ThemeId,
  episodeNumber: number,
  recentReachHashtagIds: readonly string[]
): { id: string; tags: string[] } {
  const reach = pickFresh(REACH_HASHTAGS, recentReachHashtagIds, episodeNumber);
  return {
    id: reach.id,
    tags: [BRAND_HASHTAG, THEME_HASHTAGS[theme], reach.tag],
  };
}
