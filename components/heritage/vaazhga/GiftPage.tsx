import { Cake, Flame, Flower2, Gem, Sprout, Users, type LucideIcon } from "lucide-react";
import { giftPaths, type VaazhgaReport } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import { Frame } from "./Frame";
import { OpenerVideo } from "./OpenerVideo";
import { PreviewBar } from "./PreviewBar";
import { TempleCarousel } from "./TempleCarousel";
import g from "./gift.module.css";
import s from "./report.module.css";

const DD_LOGO_LIGHT = "/heritage/dd-logo-light.png";
const DD_LOGO = "/brand/distant-devotion-logo.png";
const NAME_SECTION_ID = "your-name";

// The six Heritage Gifting categories. Uruthiyai is spelled as on the
// founder's own list; the spelling is not final.
const CATEGORIES: { name: string; sub: string; Icon: LucideIcon; current?: boolean }[] = [
  { name: "Vaazhga Vaazhthudan", sub: "Birthday", Icon: Cake, current: true },
  { name: "Thayum Seyum", sub: "New life", Icon: Sprout },
  { name: "Inaintha Idhayangal", sub: "Marriage", Icon: Gem },
  { name: "Uruthiyai Thunai", sub: "Get well", Icon: Flame },
  { name: "Peranbu", sub: "Grandparents", Icon: Users },
  { name: "Ninaivin Anjali", sub: "Remembrance", Icon: Flower2 },
];

/**
 * The page the birthday person sees. Written to them ("you"), in the Distant
 * Devotion voice (docs/heritage-gifting-voice.md). The sender is named once,
 * in the opener; everything after that speaks as Distant Devotion.
 */
export function GiftPage({ report, preview }: { report: VaazhgaReport; preview: boolean }) {
  const { recipient, deity, lampSrc, photos, initialPhotoIndex, gift } = report;
  const { tracker } = gift;
  const paths = giftPaths(gift.slug);
  const sankalpam = photos.find((p) => p.key === "sankalpam")?.src ?? lampSrc;
  const giftPhotos = photos.map((p) => ({ ...p, line: p.giftLine ?? p.line }));

  const steps = [
    { name: "Blessed at the temple", date: tracker.blessedOn, note: undefined as string | undefined },
    { name: "Packed with your sankalpam card", date: tracker.packedOn, note: undefined },
    {
      name: "On its way to you",
      date: tracker.shippedOn,
      note: tracker.shippedOn && tracker.courierRef ? `Courier reference ${tracker.courierRef}` : undefined,
    },
    { name: "Arrives at your door", date: tracker.deliveredOn, note: undefined },
  ].map((step) => ({
    ...step,
    done: Boolean(step.date),
    note: step.date ? (step.note ?? step.date) : "We will update this page",
  }));

  return (
    <div className={s.shell}>
      <main className={`${s.page} ${preview ? g.withBar : ""}`} style={preview ? undefined : { background: "var(--hg-ivory)" }}>
        <div style={preview ? { background: "var(--hg-ivory)" } : undefined}>
          {/* ---------- Opener ---------- */}
          <section className={`${g.opener} ${preview ? g.openerBar : ""}`} aria-label={`A blessing for ${recipient}`}>
            <OpenerVideo posterSrc={lampSrc} videoSrc={gift.videoSrc} />
            <div className={g.openerShade} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={g.openerLogo} src={DD_LOGO_LIGHT} alt="Distant Devotion" width={122} height={54} />
            <div className={g.openerText}>
              <span className={g.tag}>A blessing for you</span>
              <h1 className={`${s.cal} ${g.openerTitle}`}>
                Happy birthday, <em>{recipient}</em>
              </h1>
              <p className={g.sentBy}>Sent with love by {gift.sender}</p>
            </div>
            <div className={g.cue}>
              <a className={g.cueBtn} href={`#${NAME_SECTION_ID}`} aria-label="See what was offered for you">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A0B1A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v15M5 12l7 7 7-7" />
                </svg>
              </a>
            </div>
          </section>

          {/* ---------- Offered in your name ---------- */}
          <section id={NAME_SECTION_ID} className={s.lampHead}>
            <h2 className={`${s.cal} ${s.h2}`}>Offered in your name</h2>
            <p className={s.lead}>We remembered you before {deity}, with your name and your star.</p>
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
            <h2 className={`${s.cal} ${s.h2}`}>From the temple</h2>
            <p className={s.lead}>A few moments from the morning we offered your blessing.</p>
          </section>
          <div style={{ marginTop: -8 }}>
            <TempleCarousel photos={giftPhotos} initialIndex={initialPhotoIndex} />
          </div>

          {/* ---------- Prasadam ---------- */}
          <section className={g.tracker} aria-labelledby="prasadam-heading">
            <h2 id="prasadam-heading" className={`${s.cal} ${g.title}`}>
              Your prasadam is coming
            </h2>
            <p className={g.trackerLead}>
              Blessed at the temple, and soon on its way to you with your sankalpam card.
            </p>
            <ol className={g.steps}>
              {steps.map((step, i) => (
                <li key={step.name} className={`${g.step} ${step.done ? "" : g.stepPending}`}>
                  <span className={`${g.dot} ${step.done ? "" : g.dotPending}`} aria-hidden="true">
                    {step.done ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12.5 4.5 4.5L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span>
                    <b className={`${s.cal} ${g.stepName}`}>{step.name}</b>
                    <span className={g.stepNote}>{step.note}</span>
                  </span>
                </li>
              ))}
            </ol>
            {tracker.trackUrl ? (
              <a className={`${s.cal} ${s.btn}`} href={tracker.trackUrl} target="_blank" rel="noopener noreferrer">
                Track your parcel
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
            <p className={g.blessingTamil} lang="ta">
              நீடூழி வாழ்க!
              <br />
              நலமுடன் வளமுடன் வாழ்க
            </p>
            <p className={g.blessingEn}>May you live long, in health and abundance.</p>
          </section>

          {/* ---------- Six categories ---------- */}
          <section className={g.cats} aria-labelledby="cats-heading">
            <h2 id="cats-heading" className={`${s.cal} ${g.title}`}>
              Send a blessing to someone you love
            </h2>
            <p className={g.catsLead}>Six moments in a life, each with a blessing from the temple.</p>
            <ul className={g.catGrid}>
              {CATEGORIES.map(({ name, sub, Icon, current }) => (
                <li key={name} className={`${g.cat} ${current ? g.catOn : ""}`}>
                  <span className={g.catIcon} aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>
                    <b className={`${s.cal} ${g.catName}`}>{name}</b>
                    <span className={g.catSub}>{sub}</span>
                  </span>
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
    </div>
  );
}
