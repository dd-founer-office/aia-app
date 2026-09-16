import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export interface CurrentOperator {
  userId: string;
  email: string;
  operatorId: string;
  displayName: string;
}

export type OperatorAuthState =
  | { status: "signed-out" }
  | { status: "not-authorized" }
  | { status: "operator"; operator: CurrentOperator };

/**
 * Server-side only (cookie-aware client). Distinguishes "not signed in at
 * all" from "signed in but not an operator" -- the Operations Portal uses
 * the same Supabase Auth credential pool as the Contributor App (same
 * magic-link mechanism, see app/ops/sign-in/page.tsx), but operator
 * access is its own record (the operators table), never a flag on
 * contributors. A contributor account with no operators row is
 * genuinely unauthorized here, not just "not signed in."
 */
export async function getOperatorAuthState(): Promise<OperatorAuthState> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "signed-out" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed-out" };

  const { data: operator } = await supabase
    .from("operators")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!operator) return { status: "not-authorized" };

  return {
    status: "operator",
    operator: {
      userId: user.id,
      email: user.email ?? "",
      operatorId: operator.id,
      displayName: operator.display_name,
    },
  };
}
