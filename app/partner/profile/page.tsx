import { getPartnerAuthState } from "@/lib/partner";
import { getPartnerProfile } from "@/lib/partner-portal";
import { PartnerSignedOutCard, PartnerNotAuthorizedCard } from "@/components/partner/PartnerAuthGate";
import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-3.5 last:border-b-0">
      <span className="text-[13.5px] opacity-55">{label}</span>
      <span className="text-[14.5px] font-semibold">{value}</span>
    </div>
  );
}

// Read-only in V1 (locked rule) -- no settings, no editing, no
// notification preferences.
export default async function PartnerProfilePage() {
  const auth = await getPartnerAuthState();
  if (auth.status === "signed-out") return <PartnerSignedOutCard />;
  if (auth.status === "not-authorized") return <PartnerNotAuthorizedCard />;

  const profile = await getPartnerProfile();
  if (!profile) return <PartnerNotAuthorizedCard />;

  return (
    <div className="partner-portal flex min-h-dvh flex-col">
      <main className="flex-1 overflow-auto px-6 pb-6 pt-7">
        <h1 className="mb-8 text-[32px] leading-[1.08]">Profile</h1>

        <div className="mb-8 flex items-center gap-3.5 rounded-2xl p-5" style={{ background: "var(--pp-deep-teal)" }}>
          <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,.1)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--pp-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V8l9-5 9 5v13" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold leading-tight" style={{ color: "var(--pp-deep-teal-foreground)" }}>
              {profile.partnerName}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pp-mint)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[12.5px] font-semibold" style={{ color: "var(--pp-mint)" }}>
                {profile.partnerStatus === "verified" ? "Verified partner" : profile.partnerStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-1 text-[17px] font-semibold">Organization details</div>
        <div className="mt-3 rounded-2xl bg-[var(--pp-white)] px-4">
          <Row label="District" value={profile.district ?? "—"} />
          <Row label="Partner type" value={profile.partnerType ?? "—"} />
          <Row label="Contact email" value={profile.contactEmail} />
        </div>
      </main>
      <PartnerBottomNav />
    </div>
  );
}
