import { Fragment } from "react";
import { giftCopy } from "@/lib/heritage/vaazhga-gift-copy";
import { buildGiftJourney } from "@/lib/heritage/vaazhga-timeline";
import { giftPaths, type VaazhgaReport } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { Frame } from "./Frame";
import { MessageProvider } from "./MessageContext";
import { MessageSection } from "./MessageSection";
import { OpenerVideo } from "./OpenerVideo";
import { PreviewBar } from "./PreviewBar";
import { TempleCarousel } from "./TempleCarousel";
import { Timeline } from "./Timeline";
import g from "./gift.module.css";
import s from "./report.module.css";

const DD_LOGO_LIGHT = "/heritage/dd-logo-light.png";
const DD_LOGO = "/brand/distant-devotion-logo.png";
const VV_LOGO = "/heritage/vv-logo.png";
const HERO_SECTION_ID = "for-you";

// The six Heritage Gifting categories, shown by their logos (one ivory colour
// with orange accents). `height` evens out their optical size: Peranbu's
// lettering is heavier than the others, so it is drawn smaller.
const CATEGORIES: { name: string; sub: string; logo: string; height: number; current?: boolean }[] = [
  { name: "Vaazhga Vaazhthudan", sub: "Birthday", logo: "vaazhga-vaazhthudan", height: 56, current: true },
  { name: "Thayum Seyum", sub: "New life", logo: "thayum-seyum", height: 56 },
  { name: "Inaintha Idhayangal", sub: "Marriage", logo: "inaintha-idhayangal", height: 56 },
  { name: "Uruthiyai Thunai", sub: "Get well", logo: "uruthiyai-thunai", height: 56 },
  { name: "Peranbu", sub: "Grandparents", logo: "peranbu", height: 42 },
  { name: "Ninaivin Anjali", sub: "Remembrance", logo: "ninaivin-anjali", height: 56 },
];

/**
 * The page the birthday person sees. Written to them ("you"), in the Distant
 * Devotion voice (docs/heritage-gifting-voice.md). The sender is named once,
 * in the opener; everything after that speaks as Distant Devotion.
 */
export function GiftPage({ report, preview, message }: { report: VaazhgaReport; preview: boolean; message: string }) {
  const { recipient, lampSrc, photos, initialPhotoIndex, gift } = report;
  const { tracker } = gift;
  const paths = giftPaths(gift.slug);
  const sankalpam = photos.find((p) => p.key === "sankalpam")?.src ?? lampSrc;
  const giftPhotos = photos.map((p) => ({ ...p, heading: p.giftHeading ?? p.heading, line: p.giftLine ?? p.line }));

  const journey = buildGiftJourney(report);
  const c = giftCopy(report);

  return (
    <div className={s.shell}>
      <MessageProvider initial={message}>
      <main className={`${s.page} ${preview ? g.withBar : ""}`} style={preview ? undefined : { background: "var(--hg-ivory)" }}>
        <div style={preview ? { background: "var(--hg-ivory)" } : undefined}>
          {/* ---------- Opener ---------- */}
          <section className={`${g.opener} ${preview ? g.openerBar : ""}`} aria-label={`A blessing for ${recipient}`}>
            <OpenerVideo posterSrc={lampSrc} videoSrc={gift.videoSrc} />
            <div className={g.openerShade} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={g.openerLogo} src={DD_LOGO_LIGHT} alt="Distant Devotion" width={122} height={54} />
            <div className={g.openerText}>
              <h1 style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={g.openerLogoMark} src={VV_LOGO} alt={`Vaazhga Vaazhthudan, a birthday blessing for ${recipient}`} width={230} height={139} />
              </h1>
              <p className={g.sentBy}>{c.sentBy}</p>
            </div>
            <div className={g.cue}>
              <a className={g.cueBtn} href={`#${HERO_SECTION_ID}`} aria-label="Read your blessing">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A0B1A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v15M5 12l7 7 7-7" />
                </svg>
              </a>
            </div>
          </section>

          {/* ---------- Hero copy ---------- */}
          <section id={HERO_SECTION_ID} className={s.lampHead} style={{ paddingTop: 64 }}>
            <h2 className={`${s.cal} ${s.h2}`}>{c.hero.headline}</h2>
            {c.hero.paragraphs.map((text) => (
              <p key={text} className={s.lead}>
                {text}
              </p>
            ))}
          </section>

          {/* ---------- Personal message ---------- */}
          <MessageSection sender={gift.sender} recipient={recipient} preview={preview} sent={message} headline={c.message.headline} text={c.message.text} />

          {/* ---------- A prayer, made in your name ---------- */}
          <section className={s.lampHead} style={{ paddingTop: 64 }}>
            <h2 className={`${s.cal} ${s.h2}`}>{c.offering.headline}</h2>
            {c.offering.paragraphs.map((text) => (
              <p key={text} className={s.lead}>
                {text}
              </p>
            ))}
          </section>
          <div className={s.band}>
            <div className={s.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sankalpam} alt="Your sankalpam card" width={520} height={520} loading="lazy" decoding="async" />
              <Frame />
            </div>
          </div>
          <dl className={g.facts}>
            <div className={g.fact}>
              <dt><small>Birthday</small></dt>
              <dd style={{ margin: 0 }}><b className={s.cal}>{gift.birthday}</b></dd>
            </div>
            <div className={g.fact}>
              <dt><small>Star</small></dt>
              <dd style={{ margin: 0 }}><b className={s.cal}>{gift.star}</b></dd>
            </div>
            <div className={g.fact}>
              <dt><small>Temple</small></dt>
              <dd style={{ margin: 0 }}><b className={s.cal}>{gift.templeShort}</b></dd>
            </div>
          </dl>

          {/* ---------- From the temple ---------- */}
          <section className={g.sectionHead}>
            <h2 className={`${s.cal} ${s.h2}`}>{c.photos.headline}</h2>
            {c.photos.paragraphs.map((text) => (
              <p key={text} className={s.lead}>
                {text}
              </p>
            ))}
          </section>
          <div style={{ marginTop: -8 }}>
            <TempleCarousel photos={giftPhotos} initialIndex={initialPhotoIndex} />
          </div>

          {/* ---------- Prasadam ---------- */}
          <section className={g.tracker} aria-labelledby="prasadam-heading">
            <h2 id="prasadam-heading" className={`${s.cal} ${g.title}`}>
              {c.prasadam.headline}
            </h2>
            {c.prasadam.paragraphs.map((text) => (
              <p key={text} className={g.trackerLead}>
                {text}
              </p>
            ))}
            <h3 className={`${s.cal} ${g.status}`}>{c.prasadam.status.title}</h3>
            <p className={g.trackerLead}>{c.prasadam.status.text}</p>
            <div style={{ marginTop: 32 }}>
              <Timeline steps={journey.steps} current={journey.current} />
            </div>
            {tracker.trackUrl ? (
              <a className={`${s.cal} ${s.btn}`} href={tracker.trackUrl} target="_blank" rel="noopener noreferrer">
                {c.prasadam.track}
                <span className={s.btnIcon} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFEFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 19L19 5M8 5h11v11" />
                  </svg>
                </span>
              </a>
            ) : null}
          </section>

          {/* ---------- Tamil blessing ---------- */}
          <section className={g.blessing} aria-label="A blessing">
            <p className={g.blessingLabel} lang="ta">
              {c.tamil.label}
            </p>
            <p className={g.blessingTamil} lang="ta">
              {c.tamil.lines.map((line, i) => (
                <Fragment key={line}>
                  {i > 0 ? <br /> : null}
                  {line}
                </Fragment>
              ))}
            </p>
            <p className={`${g.blessingTamil} ${g.blessingWrap}`} lang="ta">
              {c.tamil.deityLine}
            </p>
            <p className={`${g.blessingTamil} ${g.blessingWrap}`} lang="ta">
              {c.tamil.closing}
            </p>
            <h2 className={`${s.cal} ${g.closingHead}`}>{c.closing.headline}</h2>
            {c.closing.paragraphs.map((text) => (
              <p key={text} className={g.closingText}>
                {text}
              </p>
            ))}
          </section>

          {/* ---------- Six categories ---------- */}
          <section className={g.cats} aria-labelledby="cats-heading">
            <h2 id="cats-heading" className={`${s.cal} ${g.title}`}>
              {c.discover.headline}
            </h2>
            {c.discover.paragraphs.map((text) => (
              <p key={text} className={g.catsLead}>
                {text}
              </p>
            ))}
            <ul className={g.catGrid}>
              {CATEGORIES.map(({ name, sub, logo, height, current }) => (
                <li key={name} className={`${g.cat} ${current ? g.catOn : ""}`}>
                  <span className={g.catSlot}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={g.catLogo} style={{ height }} src={`/heritage/categories/${logo}.png`} alt={name} width={120} height={64} loading="lazy" />
                  </span>
                  <span className={g.catSub}>{sub}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ---------- Footer ---------- */}
          <footer className={s.footer} style={{ marginTop: 0, borderRadius: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.footerLogo} src={DD_LOGO} alt="Distant Devotion" width={210} height={95} loading="lazy" />
            <p className={s.tagline}>Connecting Hearts and Roots</p>
            <p className={s.copy}>&copy; Distant Devotion</p>
          </footer>
        </div>

        {preview ? <PreviewBar recipient={recipient} publicPath={paths.public} internalPath={paths.internal} /> : null}
      </main>
      </MessageProvider>
    </div>
  );
}
