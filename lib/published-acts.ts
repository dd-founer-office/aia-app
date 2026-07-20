import { getSupabasePublicClient } from '@/lib/supabase/client';
import type { EvidenceCategory, EvidenceTraceItem, TrustCardData } from '@/components/acts/living-trace/types';

// -----------------------------------------------------------------------
// Real (Supabase-backed) published Acts, sourced from the Mission Review
// Workflow. Separate from lib/mock-data.ts, which remains the source for
// the 5 demo Acts. An Act id resolves to a mock Act OR a real published
// mission, never both -- callers check getActById() first, then fall back
// here (see app/acts/[id]/page.tsx and .../evidence/page.tsx).
//
// Cause -> category mapping (locked, confirmed 2026-07-19): unmapped
// causes intentionally fall back to "info"-kind display (no map, no
// precise location) rather than guessing -- protecting location by
// default is safer than defaulting to a map.
// -----------------------------------------------------------------------

const CAUSE_TO_CATEGORY: Record<string, EvidenceCategory> = {
  Education: 'student',
  Medical: 'family',
  Annadhanam: 'annadhanam',
  Environment: 'tree',
};

const MAP_KIND_CATEGORIES = new Set<EvidenceCategory>(['tree', 'temple', 'annadhanam']);

function categoryFor(cause: string): EvidenceCategory {
  return CAUSE_TO_CATEGORY[cause] ?? 'student'; // safest default: info-kind, no map
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDisplayTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
}

export async function getPublishedActSummary(missionId: string): Promise<PublishedActSummary | null> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    console.error('[published-acts] Supabase client is null — env vars missing.', {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });
    return null;
  }

 const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .eq('status', 'published')
    .maybeSingle();

  if (missionError || !mission) {
    console.error('[published-acts] mission lookup failed', { missionId, missionError, found: Boolean(mission) });
    return null;
  }

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

  return {
    id: mission.id,
    cause: mission.cause,
    title: publication.title,
    description: publication.description,
    organization: mission.organization,
    missionDate: formatDisplayDate(mission.mission_date),
    landmark: publication.landmark,
    heroImageUrl,
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
    .order('capture_order', { ascending: false }); // newest first, per Living Trace Constitution §7

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

  const trust: TrustCardData = isMapKind
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
      momentTitle: moment?.moment_title ?? 'Evidence Captured',
      narrative: moment?.narrative ?? '',
      captureDate: formatDisplayDate(row.capture_time as string),
      captureDateIso: row.capture_time as string,
      captureTime: formatDisplayTime(row.capture_time as string),
      capturedBy: mission.field_executive as string,
      landmark: isMapKind ? publication.landmark ?? undefined : undefined,
      gpsLat: (row.gps_lat as number | null) ?? 0,
      gpsLng: (row.gps_lng as number | null) ?? 0,
      gpsAccuracyMeters: (row.gps_accuracy_meters as number | null) ?? 0,
      approvedBy: 'AiA Verification Desk',
      approvedDate,
      trust: buildTrust(row.gps_lat as number | null, row.gps_lng as number | null),
    };
  });
}
export interface PublishedActFeedItem extends PublishedActSummary {
  missionDateIso: string;
  evidenceCount: number;
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

  const items: PublishedActFeedItem[] = [];
  for (const mission of missions) {
    const publication = publicationByMission.get(mission.id as string);
    if (!publication) continue;

    const heroImageUrl = publication.featured_evidence_id
      ? (photoByEvidenceId.get(publication.featured_evidence_id as string) ?? null)
      : null;

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
    });
  }

  return items;
}
