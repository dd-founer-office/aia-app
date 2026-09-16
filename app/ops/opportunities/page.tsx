import Link from "next/link";
import { getOperatorAuthState } from "@/lib/operator";
import { getOpportunitiesOverview } from "@/lib/opportunities";
import { OpportunitiesClient } from "@/components/ops/OpportunitiesClient";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { opsSignOutAction } from "@/lib/ops-auth-actions";

// OP-002 Opportunity Management's entry point. Same three-state operator
// gate as /ops (see that page's own comment) -- duplicated rather than
// shared as a layout, matching this app's existing per-page gating
// convention (e.g. app/page.tsx, app/profile/page.tsx) over a shared
// middleware/layout check.
export default async function OpportunitiesPage() {
  const auth = await getOperatorAuthState();

  if (auth.status === "signed-out") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col justify-center gap-4 px-5">
        <Card className="flex flex-col gap-3 text-center">
          <p className="text-lg font-semibold leading-snug">Operations Portal</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Sign in with your operator email to continue.
          </p>
          <Link href="/ops/sign-in">
            <Button className="mt-1 w-full">Sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (auth.status === "not-authorized") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col justify-center gap-4 px-5">
        <Card className="flex flex-col gap-3 text-center">
          <p className="text-lg font-semibold leading-snug">Not authorized</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            This account doesn&apos;t have Operations Portal access.
          </p>
          <form action={opsSignOutAction}>
            <Button className="mt-1 w-full" type="submit">
              Sign out
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const data = await getOpportunitiesOverview();

  return <OpportunitiesClient data={data} />;
}
