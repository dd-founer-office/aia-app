import { getSupabasePublicClient } from '@/lib/supabase/client';
import { getActContributorCounts, getMyLinkedPublishedMissionIds } from '@/lib/act-attribution';
import type { EvidenceCategory, EvidenceTraceItem, TrustCardData } from '@/components/acts/living-trace/types';

const CAUSE_TO_CATEGORY: Record<string, EvidenceCategory> = {
  Education: 'student',
  Medical: 'family',
  Annadhanam: 'annadhanam',
  Environment: 'tree',
};

const MAP_KIND_CATEGORIES = new Set<EvidenceCategory>(['tree', 'temple', 'annadhanam']);

function categoryFor(cause: string): EvidenceCategory {
  return CAUSE_TO_CATEGORY[cause] ?? 'student';
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDisplayTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatFullDateTime(iso: string, timeZone: string | null): string {
  const tz = timeZone ?? 'UTC';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
}
function prettifyReviewerName(raw: string): string {
  if (!raw.includes('@')) return raw; // already a real display name
  const local = raw.split('@')[0];
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
export interface PublishedActSummary {
  id: string;
  cause: string;
  title: string;
  description: string;
  organization: string;
  missionDate: string;
  landmark: string | null;
  heroImageUrl: string | null;
  // CA-011 Section 2 (Impact Snapshot) / Section 3 (Story) -- nullable,
  // see mission_publications_impact_story_fields migration. Genuinely
  // unknown for a mission published before these fields existed, or any
  // future one Ops hasn't filled in yet -- never fabricated.
  beneficiaryCount: number | null;
  storySituation: string | null;
  storyAction: string | null;
  storyOutcome: string | null;
  // CA-011 Section 5 (Verification Summary) -- derived, not stored.
  // gpsVerified is true when at least one evidence item has real GPS
  // coordinates (Mission Camera always requests them, but a row could
  // still lack them if capture happened without location permission).
  evidenceCount: number;
  gpsVerified: boolean;
  capturedBy: string;
  verifiedBy: string;
  publishedAtDisplay: string;
  // CA-011's locked "Participating Contributors" field -- real now (see
  // lib/act-attribution.ts), a count only, never contributor identities.
  // null when this mission has no attributable allocation at all (e.g. it
  // predates the participation_allocations ledger), same "genuinely
  // unknown, never a fabricated zero" discipline as beneficiaryCount.
  participatingContributorCount: number | null;
}

export async function getPublishedActSummary(missionId: string): Promise<PublishedActSummary | null> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return null;

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .eq('status', 'published')
    .maybeSingle();

  if (missionError || !mission) return null;

  const { data: publication, error: pubError } = await supabase
    .from('mission_publications')
    .select('*')
    .eq('mission_id', missionId)
    .maybeSingle();

  if (pubError || !publication) return null;

  let heroImageUrl: string | null = null;
  if (publication.featured_evidence_id) {
    const { data: featured } = await supabase
      .from('evidence')
      .select('photo_url')
      .eq('id', publication.featured_evidence_id)
      .maybeSingle();
    heroImageUrl = featured?.photo_url ?? null;
  }

  const { data: evidence } = await supabase
    .from('evidence')
    .select('gps_lat, gps_lng')
    .eq('mission_id', missionId);

  const contributorCounts = await getActContributorCounts([missionId]);

  return {
    id: mission.id,
    cause: mission.cause,
    title: publication.title,
    description: publication.description,
    organization: mission.organization,
    missionDate: formatDisplayDate(mission.mission_date),
    landmark: publication.landmark,
    heroImageUrl,
    beneficiaryCount: publication.beneficiary_count ?? null,
    storySituation: publication.story_situation ?? null,
    storyAction: publication.story_action ?? null,
    storyOutcome: publication.story_outcome ?? null,
    evidenceCount: evidence?.length ?? 0,
    gpsVerified: (evidence ?? []).some((e) => e.gps_lat != null && e.gps_lng != null),
    capturedBy: mission.field_executive,
    verifiedBy: prettifyReviewerName(publication.published_by as string),
    publishedAtDisplay: formatDisplayDate(publication.published_at as string),
    participatingContributorCount: contributorCounts.get(missionId) ?? null,
  };
}

export async function getPublishedActTrace(missionId: string): Promise<EvidenceTraceItem[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .eq('status', 'published')
    .maybeSingle();

  if (missionError || !mission) return [];

  const { data: publication } = await supabase
    .from('mission_publications')
    .select('*')
    .eq('mission_id', missionId)
    .maybeSingle();

  if (!publication) return [];

  const { data: evidence } = await supabase
    .from('evidence')
    .select('*')
    .eq('mission_id', missionId)
    .order('capture_order', { ascending: false });

  if (!evidence || evidence.length === 0) return [];

  const evidenceIds = evidence.map((e) => e.id as string);
  const { data: moments } = await supabase
    .from('evidence_publications')
    .select('*')
    .in('evidence_id', evidenceIds);

  const momentsByEvidenceId = new Map((moments ?? []).map((m) => [m.evidence_id as string, m]));
  const category = categoryFor(mission.cause);
  const isMapKind = MAP_KIND_CATEGORIES.has(category);
  const approvedDate = formatDisplayDate(publication.published_at);

  const buildTrust = (evidenceLat: number | null, evidenceLng: number | null): TrustCardData =>
    isMapKind
      ? {
          kind: 'map',
          verificationStatus: 'verified',
          locationLabel: publication.landmark ?? mission.organization,
          lat: evidenceLat ?? undefined,
          lng: evidenceLng ?? undefined,
        }
      : {
          kind: 'info',
          verificationStatus: 'verified',
          locationLabel: publication.landmark ?? mission.organization,
          infoLabel: category === 'student' ? 'School' : 'Support Partner',
          infoValue: mission.organization,
        };

  return evidence.map((row) => {
    const moment = momentsByEvidenceId.get(row.id as string);
    const mediaKind = (row.media_kind as string) === 'video' ? 'video' : 'photo';
    return {
      id: row.id as string,
      actId: missionId,
      category,
      mediaKind,
      photoUrl: row.photo_url as string,
      videoUrl: mediaKind === 'video' ? ((row.video_url as string | null) ?? undefined) : undefined,
      address: (row.address as string | null) ?? undefined,
      placeName: (row.place_name as string | null) ?? undefined,
      plusCode: (row.plus_code as string | null) ?? undefined,
      captureDateTimeFull: formatFullDateTime(row.capture_time as string, row.capture_timezone as string | null),
      momentTitle: moment?.moment_title ?? 'Evidence Captured',
      narrative: moment?.narrative ?? '',
      captureDate: formatDisplayDate(row.capture_time as string),
      captureDateIso: row.capture_time as string,
      captureTime: formatDisplayTime(row.capture_time as string),
      capturedBy: mission.field_executive as string,
      landmark: isMapKind ? (publication.landmark ?? undefined) : undefined,
      gpsLat: (row.gps_lat as number | null) ?? 0,
      gpsLng: (row.gps_lng as number | null) ?? 0,
      gpsAccuracyMeters: (row.gps_accuracy_meters as number | null) ?? 0,
      approvedBy: prettifyReviewerName(publication.published_by as string),
      approvedDate,
      trust: buildTrust(row.gps_lat as number | null, row.gps_lng as number | null),
    };
  });
}

// Deliberately its own shape rather than extending PublishedActSummary --
// the feed card doesn't need the detail-only fields (beneficiary count,
// story, verification data) that PublishedActSummary carries for CA-011.
export interface PublishedActFeedItem {
  id: string;
  cause: string;
  title: string;
  description: string;
  organization: string;
  missionDate: string;
  missionDateIso: string;
  landmark: string | null;
  heroImageUrl: string | null;
  evidenceCount: number;
  // Real now -- see lib/act-attribution.ts. isSharedAct is true only when
  // 2+ distinct contributors are attributed (locked rule: a single
  // contributor's own Act isn't "shared"), contributorCount is only ever
  // set alongside it.
  isSharedAct?: boolean;
  contributorCount?: number;
}

export async function getPublishedActsFeed(): Promise<PublishedActFeedItem[]> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return [];

  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('status', 'published')
    .order('mission_date', { ascending: false });

  if (!missions || missions.length === 0) return [];

  const missionIds = missions.map((m) => m.id as string);

  const { data: publications } = await supabase
    .from('mission_publications')
    .select('*')
    .in('mission_id', missionIds);

  const { data: evidenceRows } = await supabase
    .from('evidence')
    .select('id, mission_id, photo_url')
    .in('mission_id', missionIds);

  const publicationByMission = new Map((publications ?? []).map((p) => [p.mission_id as string, p]));
  const evidenceCountByMission = new Map<string, number>();
  const photoByEvidenceId = new Map<string, string>();
  for (const row of evidenceRows ?? []) {
    const key = row.mission_id as string;
    evidenceCountByMission.set(key, (evidenceCountByMission.get(key) ?? 0) + 1);
    photoByEvidenceId.set(row.id as string, row.photo_url as string);
  }

  const contributorCounts = await getActContributorCounts(missionIds);

  const items: PublishedActFeedItem[] = [];
  for (const mission of missions) {
    const publication = publicationByMission.get(mission.id as string);
    if (!publication) continue;

    const heroImageUrl = publication.featured_evidence_id
      ? (photoByEvidenceId.get(publication.featured_evidence_id as string) ?? null)
      : null;

    const contributorCount = contributorCounts.get(mission.id as string);

    items.push({
      id: mission.id as string,
      cause: mission.cause as string,
      title: publication.title as string,
      description: publication.description as string,
      organization: mission.organization as string,
      missionDate: formatDisplayDate(mission.mission_date as string),
      missionDateIso: mission.mission_date as string,
      landmark: publication.landmark as string | null,
      heroImageUrl,
      evidenceCount: evidenceCountByMission.get(mission.id as string) ?? 0,
      isSharedAct: contributorCount !== undefined && contributorCount > 1,
      contributorCount,
    });
  }

  return items;
}

/** CA-009 Home Section 3's "Recent Impact" -- the single most recently
 *  published Act system-wide, not contributor-specific (unlike Section 4's
 *  Shared Act, the locked spec just wants "most recent published impact").
 *  Requires a hero image to render, same guard the main feed applies. Was
 *  hardcoded to lib/mock-data.ts's mockLatestAct until now -- Act of Aram
 *  not being a Sprint 1 table was the reason then; it's a real, queryable
 *  entity now. */
export async function getLatestPublishedAct(): Promise<PublishedActFeedItem | null> {
  const acts = await getPublishedActsFeed();
  return acts.find((act) => act.heroImageUrl) ?? null;
}

/** CA-009 Home Section 4's real "Shared Act of Aram" -- the signed-in
 *  contributor's most recently published Act that at least one other
 *  contributor also participated in. null (section hidden) when they have
 *  no linked Acts at all, or none of their linked Acts are shared -- same
 *  "hide, don't fabricate" rule the section's own locked spec calls for. */
export async function getMySharedAct(): Promise<PublishedActSummary | null> {
  const missionIds = await getMyLinkedPublishedMissionIds();
  if (missionIds.length === 0) return null;

  const counts = await getActContributorCounts(missionIds);
  const sharedIds = missionIds.filter((id) => (counts.get(id) ?? 0) > 1);
  if (sharedIds.length === 0) return null;

  const supabase = getSupabasePublicClient();
  if (!supabase) return null;

  const { data: missions } = await supabase
    .from('missions')
    .select('id, mission_date')
    .in('id', sharedIds)
    .order('mission_date', { ascending: false })
    .limit(1);

  const mostRecentId = missions?.[0]?.id as string | undefined;
  if (!mostRecentId) return null;

  const summary = await getPublishedActSummary(mostRecentId);
  // EvidenceCard (what Home renders this with) requires a hero image --
  // same guard getPublishedActsFeed() already applies to the main feed.
  return summary && summary.heroImageUrl ? summary : null;
}
