import s from "./report.module.css";

type Glyph = "in" | "ig" | "f" | "wa";

// Distant Devotion's own accounts. WhatsApp opens a chat with +91 99889 21621.
const SOCIALS: { label: string; href?: string; glyph: Glyph }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/distantdevotionofficial", glyph: "in" },
  { label: "Instagram", href: "https://www.instagram.com/distantdevotion_official/", glyph: "ig" },
  { label: "Facebook", href: "https://www.facebook.com/distantdevotionofficial", glyph: "f" },
  { label: "WhatsApp", href: "https://wa.me/919988921621", glyph: "wa" },
];

function SocialGlyph({ glyph }: { glyph: Glyph }) {
  if (glyph === "wa") {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21l1.65-4.9A9 9 0 1 1 8 19.4L3 21z" />
        <path d="M9 8.6c0 3.5 3 6.4 6.4 6.4l1.3-1.3c.3-.3.3-.8 0-1.1l-1.2-1c-.3-.3-.8-.2-1.1.1l-.5.5c-1.1-.4-2-1.3-2.4-2.4l.5-.5c.3-.3.4-.8.1-1.1l-1-1.2c-.3-.3-.8-.3-1.1 0L9 8.6z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
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

/** The LinkedIn, Instagram, Facebook and WhatsApp icons in the footer of both pages. */
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
