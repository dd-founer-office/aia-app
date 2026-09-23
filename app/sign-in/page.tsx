"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";
import { createTestAccountAction } from "@/lib/auth-actions";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "pending" | "error";

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

// CA-006 Signup -- email + password. Sign-up goes through
// createTestAccountAction (lib/auth-actions.ts), which creates the account
// already confirmed via the Admin API and never sends a confirmation
// email -- this project has no SMTP configured, so plain signUp() failed
// outright with "Error sending confirmation email". Founder-directed
// simplification for testing the flow with throwaway accounts; swap back
// to signUp()'s own email-confirmation path once real contributors are
// onboarding and this project has real transactional email set up.
// Wrapped in Suspense because useSearchParams() (reading onboarding's own
// ?mode=signup) requires it for a page that would otherwise be fully
// static.
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "signup" ? "sign-up" : "sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const supabase = getSupabaseAuthBrowserClient();
    if (!supabase) {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
      return;
    }

    if (mode === "sign-up") {
      if (password !== confirmPassword) {
        setStatus("error");
        setErrorMessage("Passwords don't match.");
        return;
      }

      setStatus("pending");
      // Creates the account server-side, already confirmed, no email
      // sent -- see createTestAccountAction's own comment. This client
      // then signs in immediately with the same credentials.
      const createResult = await createTestAccountAction(email.trim(), password, name.trim());
      if (createResult.error) {
        setStatus("error");
        setErrorMessage(createResult.error);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    setStatus("pending");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <ScreenHeader
          title={mode === "sign-up" ? "Create your account" : "Sign in to Aram in Action"}
          subtitle={
            mode === "sign-up"
              ? "Choose a password -- you'll use it to sign back in next time."
              : "Enter your email and password to continue."
          }
        />

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className={`flex-1 rounded-[var(--radius-button)] border px-4 py-2 text-sm font-medium ${
              mode === "sign-in"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("sign-up")}
            className={`flex-1 rounded-[var(--radius-button)] border px-4 py-2 text-sm font-medium ${
              mode === "sign-up"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)]"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          {mode === "sign-up" && (
            <>
              <label htmlFor="name" className="text-sm font-medium text-[var(--color-foreground)]">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass()}
              />
            </>
          )}

          <label htmlFor="email" className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
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
            className={inputClass()}
          />

          <label htmlFor="password" className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass()}
          />

          {mode === "sign-up" && (
            <>
              <label htmlFor="confirmPassword" className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass()}
              />
            </>
          )}

          {status === "error" && errorMessage && <p className="text-sm text-[var(--color-error)]">{errorMessage}</p>}

          <Button type="submit" className="mt-1 w-full" disabled={status === "pending"}>
            {status === "pending" ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
          </Button>
        </form>
      </main>
    </div>
  );
}
