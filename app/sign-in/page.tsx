"use client";

import { useState, type FormEvent } from "react";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";

type SendState = "idle" | "sending" | "sent" | "error";

export default function SignInPage() {
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
        // Always the origin the person is actually using (localhost,
        // preview deploy, or production) -- never a hardcoded env var that
        // would break on every preview URL.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setState(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <ScreenHeader
          title="Sign in to Aram in Action"
          subtitle="Enter your email and we'll send you a link to sign in — no password needed."
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
              placeholder="you@example.com"
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
