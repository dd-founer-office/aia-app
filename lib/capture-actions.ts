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

export async function submitMissionEvidenceAction(missionId: string, items: EvidenceMeta[]): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error('Supabase is not configured on this deployment.');
  }

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('id')
    .eq('id', missionId)
    .maybeSingle();

  if (missionError || !mission) {
    throw new Error('Mission not found.');
  }

  const rows = items.map((item, index) => ({
    mission_id: missionId,
    photo_url: item.photoUrl,
    video_url: item.videoUrl,
    media_kind: item.mediaKind,
    capture_time: item.captureTime,
    capture_order: index + 1,
    gps_lat: item.gpsLat,
    gps_lng: item.gpsLng,
    gps_accuracy_meters: item.gpsAccuracyMeters,
  }));

  const { error: insertError } = await supabase.from('evidence').insert(rows);
  if (insertError) {
    throw new Error(`Failed to save evidence: ${insertError.message}`);
  }
}
