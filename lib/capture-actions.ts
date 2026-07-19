'use server';

import { getSupabaseServiceClient } from '@/lib/supabase/service';

interface EvidenceMeta {
  captureTime: string;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsAccuracyMeters: number | null;
}

export async function submitMissionEvidenceAction(missionId: string, formData: FormData): Promise<void> {
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

  const files = formData.getAll('evidence') as File[];
  const metadataRaw = formData.get('metadata');
  const metadata: EvidenceMeta[] = metadataRaw ? JSON.parse(metadataRaw as string) : [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const meta = metadata[i];
    const isVideo = file.type.startsWith('video/');
    const ext = isVideo ? 'webm' : 'jpg';
    const path = `${missionId}/${i + 1}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('mission-evidence')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw new Error(`Failed to upload evidence ${i + 1}: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('mission-evidence').getPublicUrl(path);

    const { error: insertError } = await supabase.from('evidence').insert({
      mission_id: missionId,
      photo_url: publicUrlData.publicUrl,
      capture_time: meta?.captureTime ?? new Date().toISOString(),
      capture_order: i + 1,
      gps_lat: meta?.gpsLat ?? null,
      gps_lng: meta?.gpsLng ?? null,
      gps_accuracy_meters: meta?.gpsAccuracyMeters ?? null,
    });

    if (insertError) {
      throw new Error(`Failed to save evidence ${i + 1}: ${insertError.message}`);
    }
  }
}
