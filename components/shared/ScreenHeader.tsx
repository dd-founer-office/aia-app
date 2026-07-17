interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

/** Matches Home's h1 treatment exactly (text-2xl font-semibold leading-tight tracking-tight) rather than introducing a separate display style. */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <div className="mt-6">
      <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
