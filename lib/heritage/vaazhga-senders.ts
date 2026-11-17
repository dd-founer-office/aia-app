import type { VaazhgaReport } from "./vaazhga-vaazhthudan-reports";

/**
 * Who a blessing is from, as the birthday person sees it. The booker types
 * these on the share view; they travel in the link as repeated `f=name~relation`
 * parameters (the same way the personal message travels as `m`).
 */
export type Sender = { name: string; relation: string };

export const MAX_SENDERS = 4;
const MAX_NAME = 40;
const MAX_RELATION = 24;

const clean = (value: string, max: number) =>
  value
    .replace(/[\u0000-\u001F\u007F~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/** The sender the booking itself carries: used until the link names others. */
export function defaultSenders(report: VaazhgaReport): Sender[] {
  // A booking may leave the sender blank: the booker then names them in the writing box.
  return [{ name: report.gift.sender, relation: report.gift.relation ?? "" }];
}

/** Reads the `f` parameters of a gift link; empty when none are usable. */
export function parseSenders(raw: string | string[] | undefined): Sender[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const out: Sender[] = [];
  for (const entry of list) {
    const [name = "", relation = ""] = entry.split("~");
    const n = clean(name, MAX_NAME);
    if (!n) continue;
    out.push({ name: n, relation: clean(relation, MAX_RELATION) });
    if (out.length === MAX_SENDERS) break;
  }
  return out;
}

/** The query string part for a list of senders ("f=a~b&f=c~d"), skipping blank rows. */
export function senderQuery(senders: Sender[]): string {
  return senders
    .map((s) => ({ name: clean(s.name, MAX_NAME), relation: clean(s.relation, MAX_RELATION) }))
    .filter((s) => s.name)
    .slice(0, MAX_SENDERS)
    .map((s) => `f=${encodeURIComponent(`${s.name}~${s.relation}`)}`)
    .join("&");
}

/** The small label under the sealed envelope: "Appa", or "Appa, Amma". */
export function senderLabel(senders: Sender[]): string {
  const named = senders.filter((s) => s.name.trim());
  const relations = named.map((s) => s.relation.trim()).filter(Boolean);
  if (relations.length) return relations.join(", ");
  return named.map((s) => s.name.trim()).join(" & ") || "Someone who loves you";
}

/** One sign-off line per sender: "Appa - Anand". */
export function signoffLines(senders: Sender[]): string[] {
  return senders
    .filter((s) => s.name.trim())
    .map((s) => (s.relation.trim() ? `${s.relation.trim()} - ${s.name.trim()}` : s.name.trim()));
}
