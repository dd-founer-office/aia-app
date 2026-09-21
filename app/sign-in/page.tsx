"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/browser-client";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "pending" | "error" | "check-email";

function inputClass() {
  return "rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]";
}

// CA-006 Signup -- email + password (replacing the earlier magic-link
// flow so a contributor can sign in immediately with their own chosen
// password, and an operator can test with several distinct accounts
// without needing a real inbox for each one -- as long as this Supabase
// project's Auth setting "Confirm email" is off; if it's on, signUp()
// still requires opening a confirmation link before that account can
// sign in, same as before). Wrapped in Suspense because useSearchParams()
// (reading onboarding's own ?mode=signup) requires it for a page that
// would otherwise be fully static.
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Only used if this project requires email confirmation --
          // harmless to always pass.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: name.trim() ? { full_name: name.trim() } : undefined,
        },
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        // Confirm-email is off for this project -- signed in immediately.
        router.push("/");
        router.refresh();
        return;
      }

      setStatus("check-email");
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

        {status === "check-email" ? (
          <div className="mt-8 flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Check your email</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              We sent a confirmation link to {email}. Open it on this device to finish creating your account.
            </p>
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}
