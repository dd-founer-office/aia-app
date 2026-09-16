"use client";

import { useState, type FormEvent } from "react";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";

type SendState = "idle" | "sending" | "sent" | "error";

// Operations Portal's own sign-in entry point -- distinct page/URL from
// the Contributor App's /sign-in, per founder direction (2026-09-16).
// Reuses the same magic-link mechanism and /auth/callback route (both
// draw from the same Supabase Auth credential pool), but passes next=/ops
// so a successful sign-in lands back in the Portal, not Home. Operator
// authorization itself is checked independently by getOperatorAuthState()
// once signed in -- this page alone does not grant Ops access.
export default function OpsSignInPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SendState>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("sending");
    const supabase = getSupabaseAuthBrowserClient();
    if (!supabase) {
      setState("error");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/ops`,
      },
    });

    setState(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <ScreenHeader
          title="Operations Portal"
          subtitle="Enter your operator email and we'll send you a link to sign in — no password needed."
        />

        {state === "sent" ? (
          <div className="mt-8 flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Check your email</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              We sent a sign-in link to {email}. Open it on this device to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-foreground)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@aramaction.org"
              className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
            />

            {state === "error" && (
              <p className="text-sm text-[var(--color-error)]">
                Something went wrong sending your link. Please try again.
              </p>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Send sign-in link"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
