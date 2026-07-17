import type { MockAct } from "@/lib/mock-data";
import type { EvidenceMediaItem } from "@/components/shared/EvidenceViewer";

// Test-only sample video, added per explicit instruction in an earlier
// task ("add one sample video so the interaction can be tested") -- not a
// mock-data.ts schema addition, scoped to this preview integration only.
export const SAMPLE_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/**
 * Single source of truth for the media array (hero + sample video + all
 * supporting images). Previously duplicated inline in ActDetailClient and
 * approximated with a manual "+2" formula on the Verification page --
 * both now call this instead, so the count is always correct.
 */
export function buildActMedia(act: MockAct): EvidenceMediaItem[] {
  return [
    { kind: "photo", url: act.hero_image_url, alt: act.impact_summary },
    ...act.supporting_image_urls.slice(0, 1).map((url) => ({ kind: "photo" as const, url })),
    {
      kind: "video" as const,
      url: SAMPLE_VIDEO_URL,
      posterUrl: act.supporting_image_urls[0] ?? act.hero_image_url,
      durationLabel: "0:10",
    },
    ...act.supporting_image_urls.slice(1).map((url) => ({ kind: "photo" as const, url })),
  ];
}
