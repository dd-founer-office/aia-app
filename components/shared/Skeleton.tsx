export interface SkeletonProps {
  /** Width of each bar as a Tailwind width class fragment, e.g. "60%". */
  widths?: string[];
  className?: string;
}

/**
 * Shared Skeleton primitive — loading placeholder per
 * AiA-Design-System-v1-LOCKED.md §4. Not present in Home Screen (Home
 * currently renders mock data synchronously, so there's no loading state
 * to extract from yet). Built fresh from the locked spec for future use
 * once Supabase data fetching replaces mock data (deferred to Phase 2
 * per Product OS MVP Build Sequence).
 */
export function Skeleton({ widths = ["60%", "90%"], className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 ${className}`}
    >
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-3.5 rounded-md bg-[var(--color-skeleton)]"
          style={{ width: w, marginBottom: i === widths.length - 1 ? 0 : 10 }}
        />
      ))}
    </div>
  );
}
