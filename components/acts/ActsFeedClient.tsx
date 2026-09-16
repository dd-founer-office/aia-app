"use client";

import { useState } from "react";
import Link from "next/link";
import { EvidenceCard } from "@/components/shared/EvidenceCard";
import { Button } from "@/components/shared/Button";
import { Chip } from "@/components/shared/Chip";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CAUSES } from "@/types/participation";
import type { ActFeedItem } from "@/lib/acts-feed";

const PAGE_SIZE = 10;
const CAUSE_FILTERS = ["All", ...CAUSES.map((cause) => cause.title)];

export interface ActsFeedClientProps {
  featured: ActFeedItem | null;
  recentActs: ActFeedItem[];
  sharedActs: ActFeedItem[];
}

/**
 * CA-010 Acts Feed's interactive half: Cause Filters (Section 2, applies
 * to Recent Acts only, per the locked section order) and Load More
 * pagination (Section 5, "max 10 initial, +10 per click, no infinite
 * scroll" -- locked). Featured Impact (Section 1) and Shared Acts of Aram
 * (Section 4) are both static, server-computed splits passed in as props.
 */
export function ActsFeedClient({ featured, recentActs, sharedActs }: ActsFeedClientProps) {
  const [selectedCause, setSelectedCause] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredRecent =
    selectedCause === "All" ? recentActs : recentActs.filter((act) => act.category === selectedCause);
  const visibleRecent = filteredRecent.slice(0, visibleCount);
  const hasMore = filteredRecent.length > visibleCount;

  return (
    <>
      {featured && (
        <section>
          <SectionHeader title="Featured Impact" />
          <div className="mt-3">
            <EvidenceCard
              actId={featured.id}
              heroImage={featured.heroImage}
              supportingImageCount={featured.supportingImageCount}
              category={featured.category}
              placeName={featured.placeName}
              completedDate={featured.completedDate}
              headline={featured.headline}
              supportingCopy={featured.supportingCopy}
              isSharedAct={featured.isSharedAct}
              contributorCount={featured.contributorCount}
            />
          </div>
        </section>
      )}

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {CAUSE_FILTERS.map((cause) => (
          <Chip
            key={cause}
            selected={selectedCause === cause}
            onClick={() => {
              setSelectedCause(cause);
              setVisibleCount(PAGE_SIZE);
            }}
            className="shrink-0"
          >
            {cause}
          </Chip>
        ))}
      </div>

      <section>
        <SectionHeader title="Recent Acts of Aram" />
        {visibleRecent.length > 0 ? (
          <div className="mt-3 flex flex-col gap-8">
            {visibleRecent.map((act) => (
              <EvidenceCard
                key={act.id}
                actId={act.id}
                heroImage={act.heroImage}
                supportingImageCount={act.supportingImageCount}
                category={act.category}
                placeName={act.placeName}
                completedDate={act.completedDate}
                headline={act.headline}
                supportingCopy={act.supportingCopy}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            No Acts of Aram for this cause yet.
          </p>
        )}
        {hasMore && (
          <Button
            variant="secondary"
            className="mt-6 self-center"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            View More Acts
          </Button>
        )}
      </section>

      {/* Shared Acts of Aram (CA-010 Section 4). Locked rule: "No Shared
          Acts -- Hide section entirely." Not affected by the cause filter
          above -- the locked spec pairs filters with the Recent Acts feed
          specifically (Section 2 -> Section 3), not this section. */}
      {sharedActs.length > 0 && (
        <section>
          <SectionHeader title="Shared Acts of Aram" />
          <div className="mt-3 flex flex-col gap-8">
            {sharedActs.map((act) => (
              <EvidenceCard
                key={act.id}
                actId={act.id}
                heroImage={act.heroImage}
                supportingImageCount={act.supportingImageCount}
                category={act.category}
                placeName={act.placeName}
                completedDate={act.completedDate}
                headline={act.headline}
                supportingCopy={act.supportingCopy}
                isSharedAct={act.isSharedAct}
                contributorCount={act.contributorCount}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function ActsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 pt-16 text-center">
      <p className="text-base font-medium">Acts of Aram will appear here.</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        As opportunities are completed and published, verified acts of impact will appear here.
      </p>
      <Link href="/participate/causes">
        <Button variant="text" className="mt-2">
          Participate This Month
        </Button>
      </Link>
    </div>
  );
}
