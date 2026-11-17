import s from "./report.module.css";

// Social links: icons only until the real account URLs are supplied.
const SOCIALS: { label: string; href?: string; glyph: "in" | "ig" | "f" }[] = [
  { label: "LinkedIn", glyph: "in" },
  { label: "Instagram", glyph: "ig" },
  { label: "Facebook", glyph: "f" },
];

function SocialGlyph({ glyph }: { glyph: "in" | "ig" | "f" }) {
  if (glyph === "ig") {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <span className={s.cal} aria-hidden="true">
      {glyph}
    </span>
  );
}

/** The LinkedIn, Instagram and Facebook icons in the footer of both pages. */
export function Socials() {
  return (
    <div className={s.socials}>
      {SOCIALS.map((social) =>
        social.href ? (
          <a key={social.label} className={s.social} href={social.href} aria-label={social.label} target="_blank" rel="noopener noreferrer">
            <SocialGlyph glyph={social.glyph} />
          </a>
        ) : (
          <span key={social.label} className={s.social}>
            <SocialGlyph glyph={social.glyph} />
          </span>
        ),
      )}
    </div>
  );
}
