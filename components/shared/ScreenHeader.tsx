interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <div className="mt-8">
      <h1 className="font-display text-2xl leading-snug text-(--color-aia-text-primary)">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-base text-(--color-text-secondary) font-sans">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
