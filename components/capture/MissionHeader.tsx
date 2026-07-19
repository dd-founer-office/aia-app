interface MissionHeaderProps {
  missionName: string;
}

/** Mission Camera Constitution P2 — Context Without Distraction. */
export function MissionHeader({ missionName }: MissionHeaderProps) {
  return (
    <div className="px-4 pt-3">
      <p className="text-xs text-white/70">Capturing Evidence For</p>
      <p className="font-display text-base text-white">{missionName}</p>
    </div>
  );
}
