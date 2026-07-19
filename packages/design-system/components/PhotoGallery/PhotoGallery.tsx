import { radius } from "../../tokens/radius";

export interface PhotoGalleryProps {
  /** First image is the hero; remaining render as smaller supporting images (2-4). */
  images: string[];
  altPrefix?: string;
}

/**
 * Ported from aia-app/components/shared/PhotoGallery.tsx (CA-010 Locked v1.1
 * layout: full-width hero on top, 2-4 supporting images in a row beneath).
 * No atomic Product OS spec exists for this component — it was built
 * in-spec from Visual Constitution §11 ("Apple Journal inspired photo
 * storytelling... never resemble social media"), same gap noted in the
 * original file's own comment. Carrying that flag forward here rather
 * than treating it as a fully locked spec.
 */
export function PhotoGallery({ images, altPrefix = "Evidence photo" }: PhotoGalleryProps) {
  const [hero, ...rest] = images;
  const supporting = rest.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt={`${altPrefix} 1`}
          style={{
            height: "216px",
            width: "100%",
            borderRadius: radius.photo,
            objectFit: "cover",
          }}
        />
      )}
      {supporting.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: `repeat(${supporting.length}, minmax(0, 1fr))`,
          }}
        >
          {supporting.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt={`${altPrefix} ${i + 2}`}
              style={{ height: "68px", width: "100%", borderRadius: radius.photo, objectFit: "cover" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
