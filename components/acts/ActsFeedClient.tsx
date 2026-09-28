import Link from "next/link";
import { EditorialActCard } from "@/components/acts/EditorialActCard";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { ActFeedItem } from "@/lib/acts-feed";

export interface ActsFeedClientProps {
  featured: ActFeedItem | null;
  sharedActs: ActFeedItem[];
}

/**
 * Temporary design-review filler (2026-09-28): most contributor accounts on
 * this branch only have one real published Act, so the feed below Featured
 * was empty. Two illustrative Acts, standing in until there's enough real
 * data to fill the rhythm -- remove once the feed has real Recent Acts
 * again. Photos are generated placeholder tiles (public/mock/), never real
 * evidence.
 */
const MOCK_ACTS = [
  {
    id: "mock-meal-shared",
    headline: "A Meal Shared, A Need Met",
    supportingCopy:
      "Volunteers prepared and served warm meals through the afternoon, one plate handed over at a time.",
    placeName: "Dubai, UAE",
    photoUrls: ["/mock/meal-1.jpg", "/mock/meal-2.jpg", "/mock/meal-3.jpg"],
    lat: 25.2048,
    lng: 55.2708,
  },
  {
    id: "mock-books-madurai",
    headline: "Books Find Their Way to Madurai",
    supportingCopy:
      "A small classroom received fresh notebooks and a few extra hands to help children get back to their lessons.",
    placeName: "Madurai, India",
    photoUrls: ["/mock/books-1.jpg", "/mock/books-2.jpg", "/mock/books-3.jpg"],
    lat: 9.9252,
    lng: 78.1198,
  },
];

/**
 * CA-010 Acts Feed. Featured Impact (Section 1) and Shared Acts of Aram
 * (Section 4) are static, server-computed splits passed in as props. Cause
 * Filters and the Recent Acts list/Load More (Sections 2-3) are removed for
 * now -- see MOCK_ACTS above.
 */
export function ActsFeedClient({ featured, sharedActs }: ActsFeedClientProps) {
  return (
    <>
      {featured && (
        <section>
          <SectionHeader title="Featured Impact" />
          <div className="mt-3">
            <EditorialActCard
              actId={featured.id}
              title={featured.headline}
              description={featured.supportingCopy}
              placeName={featured.placeName}
              photoUrls={featured.photoUrls}
              lat={featured.lat}
              lng={featured.lng}
              variant={0}
            />
          </div>
        </section>
      )}

      <div className="flex flex-col gap-8">
        {MOCK_ACTS.map((act, i) => (
          <EditorialActCard
            key={act.id}
            actId={act.id}
            title={act.headline}
            description={act.supportingCopy}
            placeName={act.placeName}
            photoUrls={act.photoUrls}
            lat={act.lat}
            lng={act.lng}
            variant={i + 1}
          />
        ))}
      </div>

      {/* Shared Acts of Aram (CA-010 Section 4). Locked rule: "No Shared
          Acts -- Hide section entirely." */}
      {sharedActs.length > 0 && (
        <section>
          <SectionHeader title="Shared Acts of Aram" />
          <div className="mt-3 flex flex-col gap-8">
            {sharedActs.map((act, i) => (
              <EditorialActCard
                key={act.id}
                actId={act.id}
                title={act.headline}
                description={act.supportingCopy}
                placeName={act.placeName}
                photoUrls={act.photoUrls}
                lat={act.lat}
                lng={act.lng}
                variant={i}
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
