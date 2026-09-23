import Link from "next/link";
import type { ReactNode } from "react";
import { ProgressIndicator } from "@/components/shared/ProgressIndicator";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { Button } from "@/components/shared/Button";

interface OnboardingScreenProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  continueHref: string;
  continueLabel?: string;
  backHref?: string;
  skipHref?: string;
}

/** Shared layout for CA-001-005's five onboarding screens (Welcome / What
 *  is Aram / How AiA Works / Causes of Aram / Journey Introduction). Same
 *  progress-indicator-plus-sticky-CTA pattern CA-014's Participation Flow
 *  already established (see app/participate/causes/page.tsx) -- reused
 *  here rather than inventing a second one. */
export function OnboardingScreen({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  continueHref,
  continueLabel = "Continue",
  backHref,
  skipHref,
}: OnboardingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-5 pt-10">
        <div className="flex items-center justify-between">
          <ProgressIndicator current={step} total={totalSteps} />
          {skipHref && (
            <Link href={skipHref} className="text-xs text-[var(--color-muted-foreground)] underline">
              Skip
            </Link>
          )}
        </div>
        <ScreenHeader title={title} subtitle={subtitle} />

        <div className="mt-6 flex flex-1 flex-col gap-3 pb-32">{children}</div>

        {/* Sticky CTA bar -- see app/participate/causes/page.tsx's own
            comment on why this stays opaque against the scrolling
            Living Field background. */}
        <div className="sticky bottom-0 flex w-full flex-col gap-2 bg-[var(--color-background)] py-4">
          <Link href={continueHref}>
            <Button className="w-full">{continueLabel}</Button>
          </Link>
          {backHref && (
            <Link href={backHref}>
              <Button variant="text" className="w-full">
                Back
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
