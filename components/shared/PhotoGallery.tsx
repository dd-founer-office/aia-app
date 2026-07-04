export interface PhotoGalleryProps {
  /** First image is the hero; remaining render as smaller supporting images (2-4). */
  images: string[];
  altPrefix?: string;
}

/**
 * Shared PhotoGallery primitive -- for the Acts of Aram feed.
 * No atomic Product OS spec exists (flagged in AiA-Design-System-v1-LOCKED.md
 * §7). Built in-spec from Visual Constitution §11: "Apple Journal inspired
 * photo storytelling. One hero image + supporting images... never resemble
 * social media."
 *
 * Updated for CA-010 Acts Feed (Locked v1.1): hero now sits full-width on
 * top with 2-4 supporting images in a row beneath, per CA-010's "Large Hero
 * Image" + "Two to four smaller supporting images beneath" rule. The
 * previous side-by-side layout (hero 2fr + up to 2 stacked supporting) had
 * no other callers yet, so this is a correction, not a breaking change.
 */
export function PhotoGallery({ images, altPrefix = "Act of Aram photo" }: PhotoGalleryProps) {
  const [hero, ...rest] = images;
  const supporting = rest.slice(0, 4);

  return (
    <div className="flex flex-col gap-2">
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt={`${altPrefix} 1`}
          className="h-[216px] w-full rounded-[var(--radius-photo)] object-cover"
        />
      )}
      {supporting.length > 0 && (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${supporting.length}, minmax(0, 1fr))` }}
        >
          {supporting.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt={`${altPrefix} ${i + 2}`}
              className="h-[68px] w-full rounded-[var(--radius-photo)] object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
