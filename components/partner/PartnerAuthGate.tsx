import Link from "next/link";

/** Shared not-signed-in / not-authorized card for every /partner/* page,
 *  same three-state branch every getPartnerAuthState() caller must do
 *  (mirrors the Ops Portal's own per-page pattern), factored out once
 *  since Partner Portal's messaging never varies by page. */
export function PartnerSignedOutCard() {
  return (
    <div className="partner-portal flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="pp-display text-2xl">AiA Partner Portal</p>
      <p className="mt-2 text-[15px] opacity-70">Sign in with your partner email to see your assigned activities.</p>
      <Link
        href="/partner/sign-in"
        className="mt-6 rounded-2xl px-6 py-3 text-[15px] font-bold"
        style={{ background: "var(--pp-deep-teal)", color: "var(--pp-mint)" }}
      >
        Sign in
      </Link>
    </div>
  );
}

export function PartnerNotAuthorizedCard() {
  return (
    <div className="partner-portal flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="pp-display text-2xl">Not authorized</p>
      <p className="mt-2 text-[15px] opacity-70">
        This account isn&apos;t linked to a verified AiA partner organization yet. Contact AiA Operations if you believe this is a
        mistake.
      </p>
    </div>
  );
}
