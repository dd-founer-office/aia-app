// Shared by the /api/monthly-aram route: validation, the Supabase row shape,
// and the Notion property mapping.

export const MIN_PER_ACTION = 1000;
export const MAX_PER_ACTION = 999999;

export const RELATIONSHIPS = ["Parent", "Spouse", "Child", "Friend", "Other"] as const;
export const OCCASIONS = ["Birthday", "Anniversary", "Remembrance day", "Festival", "Wedding", "New beginning", "Other"] as const;

export type SelectionInput = {
  name: string;
  contact: string;
  amounts: { annadhanam: number; tree: number; education: number; medical: number };
  dedication: null | {
    kind: "honour" | "memory";
    name: string;
    relationship: string; // "" | one of RELATIONSHIPS | free text when "Other"
    message: string;
  };
  occasion: string; // "" | one of OCCASIONS
  occasionDate: string; // "" | YYYY-MM-DD
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const mobileDigits = (v: string) => v.replace(/[\s-]/g, "").replace(/^(\+?91)/, "");
const isMobile = (v: string) => /^[6-9]\d{9}$/.test(mobileDigits(v));

export function contactKey(contact: string): string {
  const c = contact.trim();
  return isEmail(c) ? c.toLowerCase() : mobileDigits(c);
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Returns the cleaned input, or an error string. Never trusts the client. */
export function parseSelection(body: unknown): { ok: true; value: SelectionInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;
  const a = (b.amounts ?? {}) as Record<string, unknown>;

  const amounts = {
    annadhanam: Number(a.annadhanam) || 0,
    tree: Number(a.tree) || 0,
    education: Number(a.education) || 0,
    medical: Number(a.medical) || 0,
  };
  for (const v of Object.values(amounts)) {
    if (!Number.isInteger(v) || v < 0 || v > MAX_PER_ACTION || (v !== 0 && v < MIN_PER_ACTION)) {
      return { ok: false, error: "Invalid amount." };
    }
  }
  if (Object.values(amounts).every((v) => v === 0)) return { ok: false, error: "Choose at least one action." };

  const name = str(b.name, 80);
  const contact = str(b.contact, 120);
  if (!name) return { ok: false, error: "Name is required." };
  if (!(isEmail(contact) || isMobile(contact))) return { ok: false, error: "A mobile number or email is required." };

  let dedication: SelectionInput["dedication"] = null;
  if (b.dedication && typeof b.dedication === "object") {
    const d = b.dedication as Record<string, unknown>;
    const dedName = str(d.name, 80);
    if (!dedName) return { ok: false, error: "Their name is required." };
    dedication = {
      kind: d.kind === "memory" ? "memory" : "honour",
      name: dedName,
      relationship: str(d.relationship, 40),
      message: str(d.message, 280),
    };
  }

  const occasion = str(b.occasion, 30);
  if (occasion && !(OCCASIONS as readonly string[]).includes(occasion)) return { ok: false, error: "Invalid occasion." };
  const occasionDate = str(b.occasionDate, 10);
  if (occasionDate && !/^\d{4}-\d{2}-\d{2}$/.test(occasionDate)) return { ok: false, error: "Invalid date." };

  return { ok: true, value: { name, contact, amounts, dedication, occasion, occasionDate } };
}

/** First day of the current month in India, as YYYY-MM-DD. */
export function currentMonthStart(now = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function toRow(input: SelectionInput, month: string) {
  const d = input.dedication;
  return {
    month,
    name: input.name,
    contact: input.contact,
    contact_key: contactKey(input.contact),
    annadhanam: input.amounts.annadhanam,
    tree_planting: input.amounts.tree,
    education: input.amounts.education,
    medical: input.amounts.medical,
    dedication_type: d ? d.kind : null,
    dedicated_to: d ? d.name : null,
    relationship: d && d.relationship ? d.relationship : null,
    message: d && d.message ? d.message : null,
    occasion: input.occasion || null,
    occasion_date: input.occasionDate || null,
    updated_at: new Date().toISOString(),
  };
}

const text = (v: string | null | undefined) => ({ rich_text: v ? [{ text: { content: v.slice(0, 2000) } }] : [] });
const select = (v: string | null | undefined) => ({ select: v ? { name: v } : null });

/** Notion page properties for the "Monthly Aram – Cause Selections" database. */
export function toNotionProperties(row: ReturnType<typeof toRow>) {
  const known = (RELATIONSHIPS as readonly string[]).includes(row.relationship ?? "");
  const customRelation = row.relationship && !known ? row.relationship : null;
  // Notion's Relationship column is a fixed list, so a typed relationship goes
  // next to the name instead, e.g. "Amma (grandfather)".
  const dedicatedTo = row.dedicated_to ? (customRelation ? `${row.dedicated_to} (${customRelation})` : row.dedicated_to) : null;
  return {
    Member: { title: [{ text: { content: row.name } }] },
    Contact: text(row.contact),
    Month: { date: { start: row.month } },
    Annadhanam: { number: row.annadhanam },
    "Tree planting": { number: row.tree_planting },
    Education: { number: row.education },
    Medical: { number: row.medical },
    "Dedicated to": text(dedicatedTo),
    Relationship: select(row.relationship ? (known ? row.relationship : "Other") : null),
    "Dedication type": select(row.dedication_type ? (row.dedication_type === "honour" ? "In honour of" : "In memory of") : null),
    Message: text(row.message),
    Occasion: select(row.occasion),
    "Occasion date": { date: row.occasion_date ? { start: row.occasion_date } : null },
  };
}
