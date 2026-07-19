import { MapPin, MapPinOff } from "lucide-react";

interface MissionMetadataCollectorProps {
  gpsAvailable: boolean;
}

export function MissionMetadataCollector({ gpsAvailable }: MissionMetadataCollectorProps) {
  return (
    <div className="pointer-events-none absolute right-3 top-3">
      <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white">
        {gpsAvailable ? <MapPin size={12} /> : <MapPinOff size={12} />}
        {gpsAvailable ? "GPS Locked" : "GPS Unavailable"}
      </span>
    </div>
  );
}
