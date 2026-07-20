"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Bookmark, Images, TrendingUp, MapPin, Milestone, ShieldCheck, FileText } from "lucide-react";
import type { MockAct } from "@/lib/mock-data";
import { mockKuralOfTheDay } from "@/lib/mock-data";
import { buildActMedia } from "@/lib/act-media";
import { BottomNavigation } from "@/components/shared/BottomNavigation";
import { ChipCard } from "@/components/shared/ChipCard";
import { ExpandableText } from "@/components/shared/ExpandableText";

export function ActDetailClient({ act, id }: { act: MockAct; id: string }) {
  const [saved, setSaved] = useState(false);
  const mediaCount = buildActMedia(act).length;
  const latestStage = act.timeline[act.timeline.length - 1]?.label ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col pb-28">
        {/* Photo layer -- sticky, not overlapped at rest. Full photo is
            visible on load; because it's pinned to the top of the
            viewport while the sheet below scrolls normally, the sheet
            visually slides up and covers the photo as the page scrolls,
            rather than the photo being partially covered from the start.
            Tapping the photo now goes to the Evidence feed page -- there's
            no longer a separate inline modal triggered from the hero. */}
        <div className="sticky top-0 z-0 h-[320px] w-full">
          <Link href={`/acts/${id}/evidence`} className="block h-full w-full" aria-label="View evidence">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={act.hero_image_url}
              alt={act.impact_summary}
              className="h-full w-full object-cover"
            />
          </Link>

          <Link
            href="/acts"
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            <ChevronLeft size={20} color="#fff" />
          </Link>
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? "Remove from saved" : "Save this Act of Aram"}
            aria-pressed={saved}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            <Bookmark size={18} color="#fff" fill={saved ? "#fff" : "none"} />
          </button>
        </div>

        {/* The Page -- starts exactly at the photo's bottom edge at rest
            (no overlap yet, so the full photo shows), corner-edged on
            both sides. Because the photo above is sticky, scrolling the
            page moves this sheet up and over the pinned photo. */}
        <div className="relative z-10 flex flex-1 flex-col gap-8 rounded-t-[28px] bg-[var(--color-background)] px-5 pt-6">
          <div className="flex flex-col gap-3">
            <p className="text-xl font-semibold leading-snug">{act.impact_summary}</p>
            <ExpandableText lines={5}>
              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {act.story_situation} {act.story_action} {act.story_outcome}
              </p>
            </ExpandableText>
          </div>

          {/* All six sections are chip-grid cards, each navigating to its
              own dedicated page -- Evidence included. */}
          <div className="grid grid-cols-2 gap-3">
            <ChipCard
              href={`/acts/${id}/evidence`}
              icon={Images}
              label="Evidence"
              value={`${mediaCount} items`}
            />
            <ChipCard
              href={`/acts/${id}/impact`}
              icon={TrendingUp}
              label="Impact"
              value={`${act.impact_bullets.length} outcomes`}
            />
            <ChipCard
              href={`/acts/${id}/location`}
              icon={MapPin}
              label="Location"
              value={act.town}
            />
            <ChipCard
              href={`/acts/${id}/timeline`}
              icon={Milestone}
              label="Timeline"
              value={latestStage}
            />
            <ChipCard
              href={`/acts/${id}/verification`}
              icon={ShieldCheck}
              label="Verification"
              value={act.verification.gps_verified ? "GPS Verified" : "Verified"}
            />
            <ChipCard
              href={`/acts/${id}/records`}
              icon={FileText}
              label="Records"
              value={`${act.documents.length} documents`}
            />
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-tamil-serif font-normal text-sm">குறள் கூறும் அறம்</p>
            <p className="font-tamil-serif font-normal whitespace-pre-line text-base leading-relaxed">
              {mockKuralOfTheDay.kural_tamil}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {mockKuralOfTheDay.core_principle}
            </p>
            <p className="text-sm italic leading-relaxed">{mockKuralOfTheDay.aram_for_today_body}</p>
          </div>
        </div>
      </main>

      <BottomNavigation active="acts" />
    </div>
  );
}
