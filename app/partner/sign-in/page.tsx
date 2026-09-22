"use client";

import { useState, type FormEvent } from "react";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";

type SendState = "idle" | "sending" | "sent" | "error";

// Partner Portal's own sign-in entry point -- distinct from both the
// Contributor App's /sign-in and the Ops Portal's /ops/sign-in. Same
// magic-link mechanism and /auth/callback route as both (same Supabase
// Auth credential pool), redirecting to /partner on success. Partner
// authorization itself is resolved independently by getPartnerAuthState()
// once signed in -- this page alone grants nothing.
export default function PartnerSignInPage() {
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
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/partner`,
      },
    });

    setState(error ? "error" : "sent");
  }

  return (
    <div className="partner-portal flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <p className="pp-display text-[28px] leading-tight">AiA Partner Portal</p>
        <p className="mt-2 text-[15px] opacity-70">Enter your partner email and we&apos;ll send you a link to sign in.</p>

        {state === "sent" ? (
          <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-[var(--pp-white)] p-5">
            <p className="text-sm font-semibold">Check your email</p>
            <p className="text-sm opacity-70">We sent a sign-in link to {email}. Open it on this device to continue.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@partnerorg.org"
              className="rounded-2xl border-0 bg-[var(--pp-white)] px-4 py-3.5 text-[15px] outline-none"
            />

            {state === "error" && <p className="text-sm text-red-700">Something went wrong sending your link. Please try again.</p>}

            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-1 w-full rounded-2xl py-3.5 text-[15px] font-bold disabled:opacity-60"
              style={{ background: "var(--pp-deep-teal)", color: "var(--pp-mint)" }}
            >
              {state === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
