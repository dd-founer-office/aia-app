export interface PhotoGalleryProps {
  /** First image is the hero; remaining render as smaller supporting images. */
  images: string[];
  altPrefix?: string;
}

/**
 * Shared PhotoGallery primitive — for the Acts of Aram feed.
 * No atomic Product OS spec exists (flagged in
 * AiA-Design-System-v1-LOCKED.md §7). Built in-spec from Visual
 * Constitution §11: "Apple Journal inspired photo storytelling. One hero
 * image + supporting images... never resemble social media."
 * Not present in Home Screen yet — Home's "Latest Act of Aram" section is
 * currently an empty state with no backing entity in the Sprint 1 schema.
 */
export function PhotoGallery({ images, altPrefix = "Act of Aram photo" }: PhotoGalleryProps) {
  const [hero, ...supporting] = images;

  return (
    <div className="grid grid-cols-[2fr_1fr] gap-2">
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt={`${altPrefix} 1`}
          className="h-[140px] w-full rounded-[var(--radius-photo)] object-cover"
        />
      )}
      <div className="flex flex-col gap-2">
        {supporting.slice(0, 2).map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${altPrefix} ${i + 2}`}
            className="h-[66px] w-full rounded-[var(--radius-photo)] object-cover"
          />
        ))}
      </div>
    </div>
  );
}
