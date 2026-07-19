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
    ? {
        kind: 'map',
        verificationStatus: 'verified',
        locationLabel: publication.landmark ?? mission.organization,
        lat: mission.gps_lat ?? undefined,
        lng: mission.gps_lng ?? undefined,
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
      actId: missionId,
      category,
      mediaKind: 'photo',
      photoUrl: row.photo_url as string,
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
      trust,
    };
  });
}
