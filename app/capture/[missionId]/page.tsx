import { MissionCamera } from "@/components/capture/MissionCamera";

export default async function MissionCameraPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  return <MissionCamera missionId={missionId} />;
}
