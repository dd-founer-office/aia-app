import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { getActById, getActsFeed } from "@/lib/mock-data";
import { EvidenceGallery } from "@/components/shared/EvidenceGallery";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

/**
 * CA-011 -- Act of Aram Detail (Locked v1.0), MINIMAL build.
 * Built as a hard prerequisite for the Acts Feed refinement (hero tap /
 * location pill navigate here; trust + evidence gallery live here, not
 * on the feed). Covers the locked Information Hierarchy at a light level
 * of polish -- full swipe-gesture gallery, richer Related Acts treatment,
 * and Notion sign-off are still open for a dedicated CA-011 review pass.
 */
export default async function ActDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${act.latitude},${act.longitude}`;
  const sameCause = getActsFeed().filter((a) => a.id !== act.id && a.cause === act.cause);
  const related = (sameCause.length > 0
    ? sameCause
    : getActsFeed().filter((a) => a.id !== act.id)
  ).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pb-28 pt-6">
        <Link
          href="/acts"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)]"
        >
          <ChevronLeft size={16} />
          Act of Aram
        </Link>

        {/* Section 1 -- Hero Impact */}
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={act.hero_image_url}
            alt={act.impact_summary}
            className="h-[260px] w-full rounded-[var(--radius-photo)] object-cover"
          />
          <p
            className="text-xs font-medium uppercase"
            style={{ color: "var(--color-primary-dark)", letterSpacing: "0.06em" }}
          >
            {act.cause}
          </p>
          <p className="text-2xl font-semibold leading-snug">{act.impact_summary}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {act.place_name} · {act.completed_date}
          </p>
        </div>

        {/* Section 2 -- Impact Snapshot */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Who benefited</p>
            <p className="text-base font-medium">{act.beneficiary_count} people</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">What happened</p>
            <p className="text-base font-medium">{act.cause}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Where</p>
            <p className="text-base font-medium">{act.place_name}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">When</p>
            <p className="text-base font-medium">{act.completed_date}</p>
          </div>
        </div>

        {/* Section 3 -- Story */}
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed">{act.story_situation}</p>
          <p className="text-sm leading-relaxed">{act.story_action}</p>
          <p className="text-sm leading-relaxed">{act.story_outcome}</p>
        </div>

        {/* Section 4 -- Evidence Gallery */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Evidence</p>
          <EvidenceGallery
            images={[act.hero_image_url, ...act.supporting_image_urls]}
            altPrefix={`${act.cause} Act of Aram`}
          />
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--color-primary-dark)" }}
        >
          <MapPin size={14} />
          View on Map
        </a>

        {/* Section 5 -- Verification Summary */}
        <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-sm font-medium">
            This impact has been reviewed and verified before publication.
          </p>
          <ul className="flex flex-col gap-1 text-sm text-[var(--color-muted-foreground)]">
            <li>✓ Opportunity Verified</li>
            <li>✓ Execution Completed</li>
            <li>✓ Documentation Approved</li>
            <li>✓ Published</li>
          </ul>
        </div>

        {/* Section 6 -- Shared Impact (conditional) */}
        {act.is_shared_act && (
          <div className="flex flex-col gap-1">
            <span
              className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--color-badge-verified-bg)",
                color: "var(--color-primary-dark)",
              }}
            >
              Shared Act of Aram
            </span>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {act.contributor_count} contributors participated together · {act.beneficiary_count}{" "}
              beneficiaries impacted
            </p>
          </div>
        )}

        {/* Section 7 -- Reflection */}
        <p className="text-sm italic leading-relaxed text-[var(--color-muted-foreground)]">
          {act.reflection}
        </p>

        {/* Section 8 -- Related Acts */}
        {related.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Related Acts</p>
            <div className="flex flex-col gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/acts/${r.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.hero_image_url}
                    alt={r.impact_summary}
                    className="h-14 w-14 rounded-[var(--radius-photo)] object-cover"
                  />
                  <p className="text-sm font-medium leading-snug">{r.impact_summary}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation active="acts" />
    </div>
  );
}
