import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperatorAuthState } from "@/lib/operator";
import { getOpportunityDetail } from "@/lib/opportunity-detail";
import { OpportunityDetailClient } from "@/components/ops/OpportunityDetailClient";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { opsSignOutAction } from "@/lib/ops-auth-actions";

// OP-003 Opportunity Detail's entry point. Same three-state operator gate
// as /ops and /ops/opportunities (see those pages' own comments).
export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const opportunity = await getOpportunityDetail(id);
  if (!opportunity) notFound();

  return <OpportunityDetailClient opportunity={opportunity} />;
}
