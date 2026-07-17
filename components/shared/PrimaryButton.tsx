import type { ButtonHTMLAttributes } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/**
 * NOTE: the real repo already has a shared `Button` component
 * (components/shared/Button.tsx per Frontend Architecture §4). In
 * production this should become a `variant="primary"` case of that
 * component rather than a parallel implementation — kept separate here
 * only because this sandbox doesn't have the existing Button's source to
 * extend safely.
 */
export function PrimaryButton({
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={[
        "w-full min-h-[52px] rounded-2xl font-sans text-base font-medium",
        "bg-(--color-aia-primary) text-white",
        "transition-opacity duration-150 ease-out",
        isDisabled ? "opacity-40 cursor-not-allowed" : "opacity-100 cursor-pointer",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-(--color-aia-primary)",
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
            aria-hidden="true"
          />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
