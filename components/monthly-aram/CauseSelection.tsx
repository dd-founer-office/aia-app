"use client";

import { useState } from "react";
import localFont from "next/font/local";
import { ArrowRight, CalendarDays, Check, ChevronDown } from "lucide-react";
import {
  ForkKnifeIcon,
  FlowerLotusIcon,
  GraduationCapIcon,
  HandHeartIcon,
  HeartIcon,
  TreeIcon,
} from "./icons";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = localFont({
  src: "../../app/fonts/InterVF.woff2",
  weight: "100 900",
  display: "swap",
});

const TEAL = "#0A363A";
const MINT = "#68FFAD";
const PANEL = "#1B1B1B";
const CARD = "#232323";
const FIELD = "#363636";
const ERROR_RED = "#ef4444";
const STROKE_GREY = "154, 160, 158";

// Every chosen action carries its own minimum, so the floor is 1,000 per action.
const MIN_PER_ACTION = 1000;
const STEP = 100;
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type Icon = (p: { className?: string }) => React.ReactElement;

const ACTIONS: {
  id: "annadhanam" | "tree" | "education" | "medical";
  title: string;
  cause: string;
  line: string;
  Icon: Icon;
}[] = [
  { id: "annadhanam", title: "Fill a Plate", cause: "Annadhanam", line: "More than a meal, a moment of care.", Icon: ForkKnifeIcon },
  { id: "tree", title: "Grow a Tree", cause: "Tree Planting", line: "Give tomorrow a little more green.", Icon: TreeIcon },
  { id: "education", title: "Build Futures", cause: "Education", line: "Give a young mind room to grow.", Icon: GraduationCapIcon },
  { id: "medical", title: "Stand Beside", cause: "Medical Support", line: "Be there when care matters most.", Icon: HandHeartIcon },
];

type ActionId = (typeof ACTIONS)[number]["id"];

const RELATIONSHIPS = ["Parent", "Spouse", "Child", "Friend", "Other"];
const OCCASIONS = ["Birthday", "Anniversary", "Remembrance day", "Festival", "Wedding", "New beginning", "Other"];

const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isMobile = (v: string) => /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, ""));

const css = `
  .rf-panel { box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 0 26px 2px rgba(255,255,255,0.14); }
  .ma-card { position: relative; box-shadow: 0 -2px 14px -6px rgba(${STROKE_GREY},0.35); }
  .ma-card::before {
    content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
    background: linear-gradient(180deg, rgba(${STROKE_GREY},0.95) 0%, rgba(${STROKE_GREY},0.5) 30%, rgba(${STROKE_GREY},0.3) 55%, rgba(${STROKE_GREY},0.24) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
  }
  .ma-field::placeholder { color: rgba(255,255,255,0.4); }
  .ma-field { color-scheme: dark; }
`;

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full"
      style={{ background: on ? MINT : "#4a4a4a", color: TEAL }}
    >
      {on && <Check size={12} strokeWidth={3.5} />}
    </span>
  );
}

function Section({ title, sub, children }: { title?: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="ma-card rounded-lg p-4" style={{ background: CARD }}>
      {title && <h2 className={`${calSans.className} m-0 text-[17px] font-semibold text-white`}>{title}</h2>}
      {sub && <p className={`${calSans.className} m-0 mt-0.5 text-[12px] text-white/85`}>{sub}</p>}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-white">
        {label}
        {required && <span style={{ color: ERROR_RED }}> *</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs" style={{ color: ERROR_RED }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = "ma-field w-full rounded-md border-0 px-2.5 py-2 text-[13px] text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default function CauseSelection() {
  const [selected, setSelected] = useState<Record<ActionId, boolean>>({
    annadhanam: false, tree: false, education: false, medical: false,
  });
  const [amounts, setAmounts] = useState<Record<ActionId, number>>({
    annadhanam: 0, tree: 0, education: 0, medical: 0,
  });
  const [dedicate, setDedicate] = useState(false);
  const [kind, setKind] = useState<"honour" | "memory">("honour");
  const [dedName, setDedName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [tried, setTried] = useState(false);
  // While an amount is being typed it can sit below the minimum; it is clamped on blur.
  const [drafts, setDrafts] = useState<Partial<Record<ActionId, string>>>({});

  const chosen = ACTIONS.filter((a) => selected[a.id]);
  const total = chosen.reduce((sum, a) => sum + amounts[a.id], 0);

  function toggleAction(id: ActionId) {
    const next = !selected[id];
    setSelected((s) => ({ ...s, [id]: next }));
    setAmounts((a) => ({
      ...a,
      [id]: next ? MIN_PER_ACTION : 0,
    }));
  }

  function bump(id: ActionId, delta: number) {
    setAmounts((a) => ({ ...a, [id]: Math.max(MIN_PER_ACTION, a[id] + delta) }));
  }

  function typeAmount(id: ActionId, raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setDrafts((d) => ({ ...d, [id]: digits }));
    setAmounts((a) => ({ ...a, [id]: Number(digits) }));
  }

  function commitAmount(id: ActionId) {
    setAmounts((a) => ({ ...a, [id]: Math.max(MIN_PER_ACTION, a[id]) }));
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  }

  const contactTrim = contact.trim();
  const errors = {
    action: chosen.length === 0 ? "Choose at least one action for your Aram." : "",
    total: chosen.length > 0 && total < chosen.length * MIN_PER_ACTION
      ? `Add a little more to reach the minimum of ${formatINR(chosen.length * MIN_PER_ACTION)}.`
      : "",
    dedName: dedicate && !dedName.trim() ? "Add their name to complete your dedication." : "",
    name: !name.trim() ? "Add your name to continue." : "",
    contact: !contactTrim || !(isEmail(contactTrim) || isMobile(contactTrim))
      ? "Add your mobile number or email so we can stay connected."
      : "",
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (msg: string) => (tried ? msg : "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    // Saving (Supabase, then Notion) and the thank-you screen are the next phase.
  }

  return (
    <main
      className={`${inter.className} min-h-screen px-3.5 pb-8 pt-7 text-white`}
      style={{ background: `radial-gradient(120% 60% at 50% 0%, #0f4a4f 0%, ${TEAL} 55%, #082c30 100%)` }}
    >
      <style>{css}</style>
      <div className="mx-auto w-full max-w-[440px]">
        <h1 className={`${calSans.className} m-0 text-center text-[26px] font-bold leading-[1.15]`} style={{ color: MINT }}>
          Let Your Aram Take Action
        </h1>
        <p className="mx-1.5 mb-5 mt-3 text-center text-[16px] leading-[1.45] text-[#D4FFE9]">
          Choose where your monthly contribution can make a real difference.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="rf-panel flex flex-col gap-4 rounded-lg p-3"
          style={{ background: PANEL }}
        >
          <Section title="Put Aram Into Action" sub="Pick one or more ways to make a difference.">
            <div className="grid grid-cols-2 gap-2.5">
              {ACTIONS.map(({ id, title, cause, line, Icon }) => {
                const on = selected[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAction(id)}
                    className={`flex flex-col items-center rounded-lg px-2 pb-2.5 pt-3 text-center ${FOCUS}`}
                    style={{ background: FIELD, border: `1.5px solid ${on ? MINT : "transparent"}` }}
                  >
                    <span className="mb-2 text-[9.5px] uppercase tracking-[0.1em]" style={{ color: on ? MINT : "#8a8a8a" }}>
                      {cause}
                    </span>
                    <Icon className="mb-2 h-7 w-7" />
                    <span className={`${calSans.className} text-base font-bold`} style={{ color: on ? MINT : "#FFFFFF" }}>{title}</span>
                    <span className={`${calSans.className} mt-1 text-[11.5px] leading-snug`} style={{ color: on ? "#fff" : "#8a8a8a" }}>{line}</span>
                    <span className="mt-2"><Tick on={on} /></span>
                  </button>
                );
              })}
            </div>
            {show(errors.action) && <p role="alert" className="mt-2 text-xs" style={{ color: ERROR_RED }}>{errors.action}</p>}
          </Section>

          {chosen.length > 0 && (
            <Section title="Your Aram, Your Way" sub="Decide how much goes towards each action.">
              {chosen.map(({ id, title, Icon }) => (
                <div key={id} className="mb-1.5 flex items-center gap-2.5 rounded-md p-2" style={{ background: FIELD }}>
                  <span className="flex h-[34px] w-[34px] items-center justify-center rounded-md" style={{ background: TEAL, color: MINT }}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className={`${calSans.className} flex-1 text-[15px] font-semibold`}>{title}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <button type="button" aria-label={`Decrease ${title}`} disabled={amounts[id] <= MIN_PER_ACTION}
                      onClick={() => bump(id, -STEP)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] bg-[#4a4a4a] disabled:opacity-40">−</button>
                    <span className="flex items-center rounded-[5px] bg-[#2a2a2a] px-1.5 py-0.5 tabular-nums">
                      <span className="text-white/60">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label={`${title} amount in rupees`}
                        value={drafts[id] ?? amounts[id].toLocaleString("en-IN")}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => typeAmount(id, e.target.value)}
                        onBlur={() => commitAmount(id)}
                        className={`w-[50px] bg-transparent text-right text-sm text-white outline-none ${FOCUS}`}
                      />
                    </span>
                    <button type="button" aria-label={`Increase ${title}`} onClick={() => bump(id, STEP)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px]" style={{ background: MINT, color: TEAL }}>+</button>
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between text-[13px] text-white/60">
                <span>Total</span>
                <span className={`${calSans.className} text-xl`} style={{ color: MINT }}>{formatINR(total)}</span>
              </div>
              {show(errors.total) && <p role="alert" className="mt-1 text-xs" style={{ color: ERROR_RED }}>{errors.total}</p>}
            </Section>
          )}

          <Section>
            <div className="flex items-center gap-3 rounded-md px-2.5 py-[9px]" style={{ background: FIELD }}>
              <div className="flex-1">
                <p className={`${calSans.className} text-[14px] font-semibold`}>Is this Aram for someone special?</p>
                <p className={`${calSans.className} text-[12px] text-white/85`}>Carry their name into something good.</p>
              </div>
              <button
                type="button" role="switch" aria-checked={dedicate} aria-label="Dedicate this Aram"
                onClick={() => setDedicate((d) => !d)}
                className={`relative h-6 w-[42px] rounded-full transition-colors ${FOCUS}`}
                style={{ background: dedicate ? MINT : "#555" }}
              >
                <span className="absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all"
                  style={{ left: dedicate ? 21 : 3, background: dedicate ? TEAL : "#fff" }} />
              </button>
            </div>

            {dedicate && (
              <div className="mt-2">
                {([
                  ["honour", "In honour of", "For someone who makes life special.", HeartIcon],
                  ["memory", "In memory of", "For someone who lives on in your heart.", FlowerLotusIcon],
                ] as const).map(([k, t, d, Ic]) => {
                  const on = kind === k;
                  return (
                    <button key={k} type="button" aria-pressed={on} onClick={() => setKind(k)}
                      className={`mb-1.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left ${FOCUS}`}
                      style={{ background: FIELD, border: `1.5px solid ${on ? MINT : "transparent"}` }}>
                      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-md"
                        style={{ background: on ? TEAL : "#4a4a4a", color: on ? MINT : "#9a9a9a" }}>
                        <Ic className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className={`${calSans.className} block text-[15px] font-semibold`} style={{ color: on ? MINT : "#FFFFFF" }}>{t}</span>
                        <span className={`${calSans.className} block text-[12px]`} style={{ color: on ? "#fff" : "#8a8a8a" }}>{d}</span>
                      </span>
                      <Tick on={on} />
                    </button>
                  );
                })}
                <Field label="Their name" required htmlFor="ma-ded-name" error={show(errors.dedName)}>
                  <input id="ma-ded-name" className={inputCls} style={{ background: FIELD }} placeholder="Who is this for?"
                    value={dedName} onChange={(e) => setDedName(e.target.value)} maxLength={80} />
                </Field>
                <Field label="Who are they to you?" htmlFor="ma-rel">
                  <div className="relative">
                    <select id="ma-rel" className={`${inputCls} appearance-none`} style={{ background: FIELD, color: relationship ? "#fff" : "#666" }}
                      value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                      <option value="">Select</option>
                      {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70" />
                  </div>
                </Field>
                <Field label="A few words for them" htmlFor="ma-msg">
                  <textarea id="ma-msg" rows={2} className={`${inputCls} resize-none`} style={{ background: FIELD }}
                    placeholder="Write what you'd like to say…" value={message}
                    onChange={(e) => setMessage(e.target.value)} maxLength={280} />
                </Field>
              </div>
            )}
          </Section>

          <Section title="Celebrate or Remember" sub="Add a day that matters to you. It's optional.">
            <Field label="What's the occasion?" htmlFor="ma-occ">
              <div className="relative">
                <select id="ma-occ" className={`${inputCls} appearance-none`} style={{ background: FIELD, color: occasion ? "#fff" : "#666" }}
                  value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                  <option value="">Select an occasion</option>
                  {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70" />
              </div>
            </Field>
            <Field label="On which day?" htmlFor="ma-date">
              <div className="relative">
                <div
                  className="flex items-center justify-between rounded-md px-2.5 py-2 text-[13px]"
                  style={{ background: FIELD, color: occasionDate ? "#fff" : "rgba(255,255,255,0.4)" }}
                >
                  <span>{occasionDate ? new Date(`${occasionDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Select a date"}</span>
                  <CalendarDays size={16} className="text-white/70" />
                </div>
                <input
                  id="ma-date"
                  type="date"
                  aria-label="Occasion date"
                  className={`ma-field absolute inset-0 h-full w-full cursor-pointer opacity-0 ${FOCUS}`}
                  value={occasionDate}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(e) => setOccasionDate(e.target.value)}
                />
              </div>
            </Field>
          </Section>

          <Section title="A Little About You" sub="So we can connect your Aram to you.">
            <Field label="Your name" required htmlFor="ma-name" error={show(errors.name)}>
              <input id="ma-name" className={inputCls} style={{ background: FIELD }} placeholder="Your name"
                autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </Field>
            <Field label="Mobile number or email" required htmlFor="ma-contact" error={show(errors.contact)}>
              <input id="ma-contact" className={inputCls} style={{ background: FIELD }} placeholder="How can we reach you?"
                autoComplete="email" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} />
            </Field>
          </Section>

          <button
            type="submit"
            className={`flex items-center justify-center gap-1.5 rounded-md py-3 text-center text-[13px] font-semibold ${FOCUS}`}
            style={valid
              ? { background: "linear-gradient(180deg, #8DFFC4 0%, #68FFAD 55%, #3FE08C 100%)", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 0 14px rgba(104,255,173,0.28)", color: TEAL }
              : { background: "#2e2e2e", border: "1px solid transparent", color: "rgba(255,255,255,0.35)" }}
          >
            Aram Into Action
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </main>
  );
}
