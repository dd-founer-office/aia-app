import { notFound } from "next/navigation";
import { Camera, ShieldCheck, Clock, MapPin, Image as ImageIcon, Building2 } from "lucide-react";
import { getActById } from "@/lib/mock-data";
import { buildActMedia } from "@/lib/act-media";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { Card } from "@/components/shared/Card";
import { ListRow } from "@/components/shared/ListRow";

export default async function ActVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  const evidenceCount = buildActMedia(act).length;

  // NOTE: bg-[var(--color-background)] intentionally removed from this
  // root wrapper -- body already carries this exact background color
  // (globals.css), so this class was a redundant duplicate paint that
  // silently hid the Living Field's ambient canvas. Same fix as
  // app/page.tsx (Sprint 01 Foundation Completion). No other change.
  return (
    <div className="flex min-h-screen flex-col pb-16">
      <ActDetailBackHeader actId={id} title="Verification Record" />
      <div className="flex flex-col gap-4 px-5 pt-6">
        <Card className="flex flex-col">
          <ListRow icon={Camera} label="Captured by" value={act.verification.captured_by} />
          <ListRow icon={ShieldCheck} label="Verified by" value={act.verification.verified_by} />
          <ListRow icon={Clock} label="Timestamp" value={act.verification.timestamp} />
          <ListRow
            icon={MapPin}
            label="GPS Verified"
            value={act.verification.gps_verified ? "Yes" : "No"}
          />
          <ListRow icon={ImageIcon} label="Evidence Count" value={evidenceCount} />
          <ListRow
            icon={Building2}
            label="Partner Organisation"
            value={act.verification.partner_organisation}
            isLast
          />
        </Card>
      </div>
    </div>
  );
}
