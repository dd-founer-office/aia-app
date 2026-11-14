"use client";

import { useState } from "react";
import localFont from "next/font/local";
import { Check, ChevronDown } from "lucide-react";
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
const FIELD = "#2a2a2a";
const ERROR_RED = "#ef4444";
const STROKE_GREY = "170, 170, 170";

const MIN_TOTAL = 1000;
const STEP = 100;
const MIN_PER_ACTION = 100;

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
  .ma-card { position: relative; box-shadow: 0 -2px 14px -6px rgba(${STROKE_GREY},0.35); }
  .ma-card::before {
    content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
    background: linear-gradient(180deg, rgba(${STROKE_GREY},0.95) 0%, rgba(${STROKE_GREY},0.5) 30%, rgba(${STROKE_GREY},0.3) 55%, rgba(${STROKE_GREY},0.24) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
  }
  .ma-field::placeholder { color: #666; }
  .ma-field { color-scheme: dark; }
`;

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full"
      style={{ background: on ? MINT : "#3a3a3a", color: TEAL }}
    >
      {on && <Check size={12} strokeWidth={3.5} />}
    </span>
  );
}

function Section({ title, sub, children }: { title?: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="ma-card rounded-lg p-3" style={{ background: CARD }}>
      {title && <h2 className={`${calSans.className} text-[18px] leading-tight text-white`}>{title}</h2>}
      {sub && <p className="mb-2.5 mt-0.5 text-xs text-white/60">{sub}</p>}
      {children}
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

const inputCls = "ma-field w-full rounded-md border-0 px-2.5 py-2 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#68FFAD]";

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

  const chosen = ACTIONS.filter((a) => selected[a.id]);
  const total = chosen.reduce((sum, a) => sum + amounts[a.id], 0);

  function toggleAction(id: ActionId) {
    const next = !selected[id];
    setSelected((s) => ({ ...s, [id]: next }));
    setAmounts((a) => ({
      ...a,
      [id]: next ? (chosen.length === 0 ? MIN_TOTAL : MIN_PER_ACTION) : 0,
    }));
  }

  function bump(id: ActionId, delta: number) {
    setAmounts((a) => ({ ...a, [id]: Math.max(MIN_PER_ACTION, a[id] + delta) }));
  }

  const contactTrim = contact.trim();
  const errors = {
    action: chosen.length === 0 ? "Choose at least one action for your Aram." : "",
    total: chosen.length > 0 && total < MIN_TOTAL ? `Add a little more to reach the minimum of ${formatINR(MIN_TOTAL)}.` : "",
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
        <h1 className={`${calSans.className} text-center text-[28px] leading-[1.15]`} style={{ color: MINT }}>
          Let Your Aram Take Action
        </h1>
        <p className="mx-1.5 mb-[18px] mt-2 text-center text-sm leading-normal text-[#e6fff3]">
          Choose where your monthly contribution can make a real difference.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-2 rounded-[10px] p-2"
          style={{ background: PANEL, boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 26px 2px rgba(255,255,255,0.12)" }}
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
                    className="flex flex-col items-center rounded-lg px-2 pb-2.5 pt-3 text-center"
                    style={{ background: FIELD, border: `1px solid ${on ? MINT : "#333"}` }}
                  >
                    <span className="mb-2 text-[9.5px] uppercase tracking-[0.1em]" style={{ color: on ? MINT : "#666" }}>
                      {cause}
                    </span>
                    <Icon className="mb-2 h-7 w-7" />
                    <span className="text-base font-bold" style={{ color: on ? MINT : "#8a8a8a" }}>{title}</span>
                    <span className="mt-1 text-[11.5px] leading-snug" style={{ color: on ? "#fff" : "#6b6b6b" }}>{line}</span>
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
                  <span className="flex-1 text-sm font-semibold">{title}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <button type="button" aria-label={`Decrease ${title}`} disabled={amounts[id] <= MIN_PER_ACTION}
                      onClick={() => bump(id, -STEP)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] bg-[#3a3a3a] disabled:opacity-40">−</button>
                    <span className="min-w-[52px] text-center tabular-nums">{formatINR(amounts[id])}</span>
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
                <p className="text-sm font-semibold">Is this Aram for someone special?</p>
                <p className="text-[11px] text-white/50">Carry their name into something good.</p>
              </div>
              <button
                type="button" role="switch" aria-checked={dedicate} aria-label="Dedicate this Aram"
                onClick={() => setDedicate((d) => !d)}
                className="relative h-6 w-[42px] rounded-full transition-colors"
                style={{ background: dedicate ? MINT : "#444" }}
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
                      className="mb-1.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left"
                      style={{ background: FIELD, border: `1px solid ${on ? MINT : "#333"}` }}>
                      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-md"
                        style={{ background: on ? TEAL : "#333", color: on ? MINT : "#777" }}>
                        <Ic className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold" style={{ color: on ? MINT : "#8a8a8a" }}>{t}</span>
                        <span className="block text-[11.5px]" style={{ color: on ? "#fff" : "#6b6b6b" }}>{d}</span>
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
              <input id="ma-date" type="date" className={inputCls} style={{ background: FIELD, color: occasionDate ? "#fff" : "#666" }}
                value={occasionDate} onChange={(e) => setOccasionDate(e.target.value)} />
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
            className="rounded-md py-3 text-center font-bold"
            style={valid
              ? { background: "linear-gradient(180deg, #8DFFC4 0%, #68FFAD 55%, #3FE08C 100%)", color: TEAL }
              : { background: "#2e2e2e", color: "rgba(255,255,255,0.35)" }}
          >
            Aram Into Action
          </button>
        </form>
      </div>
    </main>
  );
}
