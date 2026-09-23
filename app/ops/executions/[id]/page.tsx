import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperatorAuthState } from "@/lib/operator";
import { getExecutionDetail } from "@/lib/execution-detail";
import { ExecutionDetailClient } from "@/components/ops/ExecutionDetailClient";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { opsSignOutAction } from "@/lib/ops-auth-actions";

// OP-005A Execution Detail & Evidence Upload's entry point. Same
// three-state operator gate as the other Ops pages (see their own
// comments).
export default async function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const execution = await getExecutionDetail(id);
  if (!execution) notFound();

  return <ExecutionDetailClient execution={execution} />;
}
