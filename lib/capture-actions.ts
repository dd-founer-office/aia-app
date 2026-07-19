'use server';

import { getSupabaseServiceClient } from '@/lib/supabase/service';

interface EvidenceMeta {
  photoUrl: string;
  videoUrl: string | null;
  mediaKind: 'photo' | 'video';
  captureTime: string;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracyMeters: number | null;
}

const CAUSE_TO_CATEGORY: Record<string, string> = {
  Education: 'student',
  Medical: 'family',
  Annadhanam: 'annadhanam',
  Environment: 'tree',
};

// Only these categories ever reveal precise location in the Living Trace
// Viewer (locked privacy rule). We don't even compute/store an address
// for student/family evidence -- nothing to leak if it's never generated.
const MAP_KIND_CATEGORIES = new Set(['tree', 'temple', 'annadhanam']);

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;
    return data.results[0].formatted_address as string;
  } catch {
    return null;
  }
}

export async function submitMissionEvidenceAction(missionId: string, items: EvidenceMeta[]): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error('Supabase is not configured on this deployment.');
  }

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('id, cause')
    .eq('id', missionId)
    .maybeSingle();

  if (missionError || !mission) {
    throw new Error('Mission not found.');
  }

  const category = CAUSE_TO_CATEGORY[mission.cause as string] ?? 'student';
  const isMapKind = MAP_KIND_CATEGORIES.has(category);

  const rows = await Promise.all(
    items.map(async (item, index) => {
      let address: string | null = null;
      if (isMapKind && item.gpsLat !== null && item.gpsLng !== null) {
        address = await reverseGeocode(item.gpsLat, item.gpsLng);
      }

      return {
        mission_id: missionId,
        photo_url: item.photoUrl,
        video_url: item.videoUrl,
        media_kind: item.mediaKind,
        address,
        capture_time: item.captureTime,
        capture_order: index + 1,
        gps_lat: item.gpsLat,
        gps_lng: item.gpsLng,
        gps_accuracy_meters: item.gpsAccuracyMeters,
      };
    })
  );

  const { error: insertError } = await supabase.from('evidence').insert(rows);
  if (insertError) {
    throw new Error(`Failed to save evidence: ${insertError.message}`);
  }
}
