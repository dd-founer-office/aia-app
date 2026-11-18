import type { Sender } from "@/lib/heritage/vaazhga-senders";
import { giftCopy } from "@/lib/heritage/vaazhga-gift-copy";
import { buildGiftJourney } from "@/lib/heritage/vaazhga-timeline";
import { giftPaths, type VaazhgaReport } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { Frame } from "./Frame";
import { MessageProvider } from "./MessageContext";
import { MessageSection } from "./MessageSection";
import { HeroReveal } from "./HeroReveal";
import { PreviewBar } from "./PreviewBar";
import { TempleCarousel } from "./TempleCarousel";
import { Timeline } from "./Timeline";
import { Socials } from "./Socials";
import { TrackButton } from "./TrackButton";
import { TrackingChip } from "./TrackingChip";
import g from "./gift.module.css";
import s from "./report.module.css";

const DD_LOGO = "/brand/distant-devotion-logo.png";
const DD_LOGO_LIGHT = "/heritage/dd-logo-light.png";
const VV_LOGO = "/heritage/vv-logo.png";
const PRAYER_SECTION_ID = "prayer";
const JOURNEY_SECTION_ID = "journey";
const COMPOSE_ID = "your-words";

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
export function GiftPage({ report, preview, message, senders }: { report: VaazhgaReport; preview: boolean; message: string; senders: Sender[] }) {
  const { recipient, lampSrc, photos, initialPhotoIndex, gift } = report;
  const { tracker } = gift;
  const paths = giftPaths(gift.slug);
  const sankalpamPhoto = photos.find((p) => p.key === "sankalpam");
  const sankalpam = sankalpamPhoto?.src ?? lampSrc;
  const giftPhotos = photos.map((p) => ({ ...p, heading: p.giftHeading ?? p.heading, line: p.giftLine ?? p.line }));

  const journey = buildGiftJourney(report);
  const c = giftCopy(report);

  return (
    <div className={s.shell}>
      <MessageProvider initial={message} initialSenders={senders}>
      <main className={`${s.page} ${preview ? g.withBar : ""}`} style={preview ? undefined : { background: "var(--hg-ivory)" }}>
        <div style={preview ? { background: "var(--hg-ivory)" } : undefined}>
          {/* ---------- Hero ---------- */}
          <HeroReveal
            headline={c.hero.headline}
            highlight={c.hero.highlight}
            paragraphs={c.hero.paragraphs}
            preview={preview}
            composeId={COMPOSE_ID}
            tamil={c.tamil}
            ddLogoSrc={DD_LOGO_LIGHT}
            logoSrc={VV_LOGO}
            logoAlt={`Vaazhga Vaazhthudan, a birthday blessing for ${recipient}`}
            posterSrc={lampSrc}
            videoSrc={gift.videoSrc}
            nextId={PRAYER_SECTION_ID}
          />

          {/* ---------- The booker's writing box (preview only) ---------- */}
          {preview ? (
            <MessageSection recipient={recipient} preview composeId={COMPOSE_ID} />
          ) : null}

          {/* ---------- A prayer, made in your name ---------- */}
          <section id={PRAYER_SECTION_ID} className={s.lampHead} style={{ paddingTop: 64 }}>
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
              <img className={sankalpamPhoto?.wide ? s.cardWhole : undefined} src={sankalpam} alt="Your sankalpam card" width={520} height={520} loading="lazy" decoding="async" />
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
          <section id={JOURNEY_SECTION_ID} className={g.tracker} aria-labelledby="prasadam-heading">
            <h2 id="prasadam-heading" className={`${s.cal} ${g.title}`}>
              {c.prasadam.headline}
            </h2>
            {c.prasadam.paragraphs.map((text) => (
              <p key={text} className={g.trackerLead}>
                {text}
              </p>
            ))}
            <div style={{ marginTop: 32 }}>
              <Timeline steps={journey.steps} current={journey.current} />
            </div>
          </section>

          {/* ---------- Track here ---------- */}
          <div className={g.trackRow}>
            <h2 className={`${s.cal} ${s.h2}`}>{c.prasadam.status.title}</h2>
            <p className={s.lead}>{c.prasadam.status.text}</p>
            {tracker.courierRef ? <TrackingChip courier={tracker.courier} reference={tracker.courierRef} /> : null}
            <TrackButton label={c.prasadam.track} trackUrl={tracker.trackUrl} targetId={JOURNEY_SECTION_ID} />
          </div>

          {/* ---------- Closing ---------- */}
          <section className={g.blessing} aria-label="Closing">
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
            <Socials />
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
