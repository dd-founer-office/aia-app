import {
  TILE_ROWS,
  type PhotoKey,
  type VaazhgaReport as Report,
} from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { SeeMoreButton } from "./SeeMoreButton";
import { TempleCarousel } from "./TempleCarousel";
import { TileRows } from "./TileRows";
import s from "./report.module.css";

const LAMP_SECTION_ID = "lamp";
const VV_LOGO = "/heritage/vv-logo.png";
const DD_LOGO = "/brand/distant-devotion-logo.png";

// Social links: icons only until the real account URLs are supplied.
const SOCIALS: { label: string; href?: string; glyph: "in" | "ig" | "f" }[] = [
  { label: "LinkedIn", glyph: "in" },
  { label: "Instagram", glyph: "ig" },
  { label: "Facebook", glyph: "f" },
];

function cap(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function Frame() {
  return (
    <div className={s.frame} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

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

/**
 * The report we send to the person who sent a Vaazhga Vaazhthudan blessing.
 * Written to them ("you"), in the Distant Devotion voice (see
 * docs/heritage-gifting-voice.md).
 */
export function VaazhgaReport({ report }: { report: Report }) {
  const { recipient, pronouns: p, deity, lampSrc, photos, initialPhotoIndex, giftHref } = report;
  const srcByKey = new Map<PhotoKey, string>(photos.map((photo) => [photo.key, photo.src]));

  return (
    <div className={s.shell}>
      <main className={s.page}>
        {/* ---------- Hero ---------- */}
        <div className={s.heroWrap}>
          <section className={s.hero} aria-label="Done, as promised">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.logo} src={DD_LOGO} alt="Distant Devotion" width={119} height={54} />
            <div className={s.heroText}>
              <p className={s.tamilLabel} lang="ta">
                வாழ்க வாழ்த்துடன்
              </p>
              <h1 className={`${s.cal} ${s.heroTitle}`}>Done, as promised</h1>
              <p className={s.heroBody}>
                You asked us to remember {recipient} before {deity}. We did, with {p.possessive}{" "}
                name, {p.possessive} star, and your love for {p.object}. Wherever {p.subject} is
                today, a blessing found {p.object}.
              </p>
              <SeeMoreButton targetId={LAMP_SECTION_ID} />
            </div>
          </section>

          <TileRows
            rows={TILE_ROWS.map((row) =>
              row.map((tile) =>
                tile === "logo"
                  ? ({ kind: "logo" } as const)
                  : ({ kind: "photo", src: srcByKey.get(tile) ?? lampSrc } as const),
              ),
            )}
            logoSrc={VV_LOGO}
          />
        </div>

        {/* ---------- Lamp ---------- */}
        <section id={LAMP_SECTION_ID} className={s.lampHead}>
          <h2 className={`${s.cal} ${s.h2}`}>It all starts with a lamp</h2>
          <p className={s.lead}>Every blessing begins with a flame. This one began with yours.</p>
        </section>
        <div className={s.band}>
          <div className={s.card}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lampSrc} alt="Lamps burning at the temple" width={989} height={989} loading="lazy" decoding="async" />
            <Frame />
          </div>
        </div>

        {/* ---------- Temple ---------- */}
        <section className={s.transition}>
          <h2 className={`${s.cal} ${s.h2}`}>Then we carried it to the Lord&rsquo;s door</h2>
          <p className={s.lead}>
            Your blessing reached {deity} temple, and this is what happened there.
          </p>
        </section>
        <TempleCarousel photos={photos} initialIndex={initialPhotoIndex} />

        {/* ---------- Send ---------- */}
        <section className={s.send} aria-labelledby="send-heading">
          <h2 id="send-heading" className={`${s.cal} ${s.h2}`}>
            Now, send it to {recipient}
          </h2>
          <p className={s.lead}>
            {cap(p.subject)} will see a page made just for {p.object}, with the blessing, the
            photos and {p.possessive} prasadam on its way. Add your own words when you share it.
          </p>
          <div className={s.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lampSrc} alt="" width={989} height={989} loading="lazy" decoding="async" />
            <div className={s.shade} />
            <div className={s.previewText}>
              <span className={s.previewTag}>A blessing for you</span>
              <span className={`${s.cal} ${s.previewTitle}`}>Happy birthday, {recipient}</span>
            </div>
            <Frame />
          </div>
          {giftHref ? (
            <>
              <a className={`${s.cal} ${s.btn}`} href={giftHref}>
                Send to {recipient}
                <SendIcon />
              </a>
              <p className={s.note}>You will see a preview first.</p>
            </>
          ) : (
            <>
              <button type="button" className={`${s.cal} ${s.btn} ${s.btnOff}`} disabled aria-disabled="true">
                Send to {recipient}
                <SendIcon />
              </button>
              <p className={s.note}>Sharing opens once the gift page is ready.</p>
            </>
          )}
        </section>

        {/* ---------- Closing ---------- */}
        <section className={s.end} aria-label="Your prasadam">
          <p className={s.tamilLine} lang="ta">
            விரைவில் அருளும்
            <br />
            பொருளும் இல்லம் சேரும்
          </p>
          <p className={s.endEn}>Soon, the grace and the offering will reach home.</p>
          <p className={s.endNote}>
            {recipient}&rsquo;s prasadam is being packed with {p.possessive} sankalpam card. We will
            update this page as soon as it is on its way.
          </p>
        </section>

        {/* ---------- Footer ---------- */}
        <footer className={s.footer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.footerLogo} src={DD_LOGO} alt="Distant Devotion" width={210} height={95} loading="lazy" />
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
          <p className={s.tagline}>Connecting Hearts and Roots</p>
          <p className={s.copy}>&copy; Distant Devotion</p>
        </footer>
      </main>
    </div>
  );
}

function SendIcon() {
  return (
    <span className={s.btnIcon} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFEFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19L19 5M8 5h11v11" />
      </svg>
    </span>
  );
}
