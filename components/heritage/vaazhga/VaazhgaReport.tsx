import { Fragment } from "react";
import {
  TILE_ROWS,
  giftPaths,
  type PhotoKey,
  type VaazhgaReport as Report,
} from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { reportCopy } from "@/lib/heritage/vaazhga-copy";
import { buildBookerJourney } from "@/lib/heritage/vaazhga-timeline";
import { Frame } from "./Frame";
import { SendButton } from "./SendButton";
import { TempleCarousel } from "./TempleCarousel";
import { TrackButton } from "./TrackButton";
import { Timeline } from "./Timeline";
import { TileRows } from "./TileRows";
import s from "./report.module.css";

const LAMP_SECTION_ID = "lamp";
const JOURNEY_SECTION_ID = "journey";
const VV_LOGO = "/heritage/vv-logo.png";
// Transparent version, so the footer line art shows through around the lettering.
const DD_LOGO_CLEAR = "/heritage/dd-logo-light.png";

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

/**
 * The report we send to the person who sent a Vaazhga Vaazhthudan blessing.
 * Written to them ("you"), in the Distant Devotion voice (see
 * docs/heritage-gifting-voice.md).
 */
export function VaazhgaReport({ report }: { report: Report }) {
  const { recipient, lampSrc, photos, initialPhotoIndex, gift } = report;
  const paths = giftPaths(gift.slug);
  const journey = buildBookerJourney(report);
  const c = reportCopy(report);
  const [heroBefore, heroAfter] = c.hero.headline.split(c.hero.highlight);
  const packing = journey.steps[journey.current]?.key === "packed";
  const srcByKey = new Map<PhotoKey, string>(photos.map((photo) => [photo.key, photo.src]));

  return (
    <div className={s.shell}>
      <main className={s.page}>
        {/* ---------- Hero ---------- */}
        <div className={s.heroWrap}>
          <section className={s.hero} aria-label={c.hero.headline}>
            <div className={s.heroText}>
              <p className={s.tamilLabel} lang="ta">
                வாழ்க வாழ்த்துடன்
              </p>
              <h1 className={`${s.cal} ${s.heroTitle}`}>
                {heroBefore}
                <span className={s.heroMark}>
                  {c.hero.highlight}
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                </span>
                {heroAfter}
              </h1>
              {c.hero.paragraphs.map((text, i) => (
                <p key={text} className={`${s.heroBody} ${i === c.hero.paragraphs.length - 1 ? s.heroBodyAccent : ""}`}>
                  {text}
                </p>
              ))}
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
          <h2 className={`${s.cal} ${s.h2}`}>{c.lamp.headline}</h2>
          {c.lamp.paragraphs.map((text) => (
            <p key={text} className={s.lead}>
              {text}
            </p>
          ))}
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
          <h2 className={`${s.cal} ${s.h2}`}>{c.temple.headline}</h2>
          {c.temple.paragraphs.map((text) => (
            <p key={text} className={s.lead}>
              {text}
            </p>
          ))}
        </section>
        <TempleCarousel photos={photos} initialIndex={initialPhotoIndex} />

        {/* ---------- Send ---------- */}
        <section className={s.send} aria-labelledby="send-heading">
          <h2 id="send-heading" className={`${s.cal} ${s.h2}`}>
            {c.share.headline}
          </h2>
          {c.share.paragraphs.map((text) => (
            <p key={text} className={s.lead}>
              {text}
            </p>
          ))}
          <div className={s.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lampSrc} alt="" width={989} height={989} loading="lazy" decoding="async" />
            <div className={s.shade} />
            <div className={s.previewText}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.previewLogo} src={VV_LOGO} alt={`Vaazhga Vaazhthudan, for ${recipient}`} width={150} height={91} />
            </div>
            <Frame />
          </div>
          <SendButton label={c.share.button} publicPath={paths.public} internalPath={paths.internal} />
          <p className={s.note}>{c.share.note}</p>
        </section>

        {/* ---------- Prasadam journey ---------- */}
        <section id={JOURNEY_SECTION_ID} className={s.journey} aria-labelledby="journey-heading">
          <h2 id="journey-heading" className={`${s.cal} ${s.h2}`}>
            {c.status.headline}
          </h2>
          {c.status.paragraphs.map((text) => (
            <p key={text} className={s.lead}>
              {text}
            </p>
          ))}
          <Timeline steps={journey.steps} current={journey.current} heading={c.journey.heading} />
        </section>

        {/* ---------- Closing ---------- */}
        <section className={s.end} aria-label="Your prasadam">
          <p className={s.tamilLine} lang="ta">
            {c.tamil.lines.map((line, i) => (
              <Fragment key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
          <p className={s.endEn}>{c.tamil.english}</p>
          {packing ? <p className={s.endNote}>{c.status.packing}</p> : null}
          <TrackButton label={c.track.button} trackUrl={gift.tracker.trackUrl} targetId={JOURNEY_SECTION_ID} />
        </section>

        {/* ---------- Footer ---------- */}
        <footer className={`${s.footer} ${s.footerWithArt}`}>
          <div className={s.footerArt} aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.footerLogo} src={DD_LOGO_CLEAR} alt="Distant Devotion" width={210} height={93} loading="lazy" />
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

