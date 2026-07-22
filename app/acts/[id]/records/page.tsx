import { notFound } from "next/navigation";
import { FileText, Receipt, ExternalLink } from "lucide-react";
import { getActById } from "@/lib/mock-data";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { Card } from "@/components/shared/Card";
import { ListRow } from "@/components/shared/ListRow";

export default async function ActRecordsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  // NOTE: bg-[var(--color-background)] intentionally removed from this
  // root wrapper -- body already carries this exact background color
  // (globals.css), so this class was a redundant duplicate paint that
  // silently hid the Living Field's ambient canvas. Same fix as
  // app/page.tsx (Sprint 01 Foundation Completion). No other change.
  return (
    <div className="flex min-h-screen flex-col pb-16">
      <ActDetailBackHeader actId={id} title="Records" />
      <div className="flex flex-col gap-4 px-5 pt-6">
        <Card className="flex flex-col">
          {act.documents.map((doc, i) => (
            <a key={doc.label} href={doc.url} className="block">
              <ListRow
                icon={doc.label.includes("Invoice") ? FileText : Receipt}
                label={doc.label}
                value=""
                trailing={
                  <ExternalLink size={14} style={{ color: "var(--color-muted-foreground)" }} />
                }
                isLast={i === act.documents.length - 1}
              />
            </a>
          ))}
        </Card>
      </div>
    </div>
  );
}
