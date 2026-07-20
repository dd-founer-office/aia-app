'use server';

import { getSupabaseServiceClient } from '@/lib/supabase/service';

interface EvidenceMeta {
  photoUrl: string;
  videoUrl: string | null;
  mediaKind: 'photo' | 'video';
  captureTime: string;
  captureTimezone: string | null;
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

interface GeocodeResult {
  address: string;
  placeName: string | null;
  plusCode: string | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  if (!apiKey) {
    console.error('[geocode] GOOGLE_MAPS_GEOCODING_API_KEY is not set.');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) {
      console.error('[geocode] Geocoding failed', { status: data.status, errorMessage: data.error_message });
      return null;
    }

    const primary = data.results[0];
    const components: Array<{ long_name: string; types: string[] }> = primary.address_components ?? [];
    const find = (type: string) => components.find((c) => c.types.includes(type))?.long_name;
    const locality = find('locality') ?? find('sublocality') ?? find('administrative_area_level_2');
    const state = find('administrative_area_level_1');
    const country = find('country');
    const placeName = [locality, state, country].filter(Boolean).join(', ') || null;
    const plusCode: string | null = data.plus_code?.compound_code
      ? (data.plus_code.compound_code as string).split(' ')[0]
      : null;

    return {
      address: primary.formatted_address as string,
      placeName,
      plusCode,
    };
  } catch (err) {
    console.error('[geocode] Geocoding request threw', err);
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
      let placeName: string | null = null;
      let plusCode: string | null = null;

      if (isMapKind && item.gpsLat !== null && item.gpsLng !== null) {
        const geocoded = await reverseGeocode(item.gpsLat, item.gpsLng);
        if (geocoded) {
          address = geocoded.address;
          placeName = geocoded.placeName;
          plusCode = geocoded.plusCode;
        }
      }

      return {
        mission_id: missionId,
        photo_url: item.photoUrl,
        video_url: item.videoUrl,
        media_kind: item.mediaKind,
        address,
        place_name: placeName,
        plus_code: plusCode,
        capture_timezone: item.captureTimezone,
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
