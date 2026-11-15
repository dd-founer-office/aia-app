import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { contactKey, currentMonthStart, parseSelection, toNotionProperties, toRow } from "@/lib/monthly-aram";

export const runtime = "nodejs";

type Row = ReturnType<typeof toRow>;

/**
 * Writes the row to Notion (create, or update if it already has a page).
 * Needs NOTION_TOKEN and NOTION_DATABASE_ID; without them the row is simply
 * left as 'skipped' and nothing fails for the member.
 */
async function syncToNotion(row: Row, pageId: string | null): Promise<{ status: "synced" | "failed" | "skipped"; pageId?: string; error?: string }> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return { status: "skipped" };
  try {
    const res = await fetch(pageId ? `https://api.notion.com/v1/pages/${pageId}` : "https://api.notion.com/v1/pages", {
      method: pageId ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify(pageId ? { properties: toNotionProperties(row) } : { parent: { database_id: databaseId }, properties: toNotionProperties(row) }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { status: "failed", error: `${res.status} ${json.message ?? ""}`.trim().slice(0, 300) };
    return { status: "synced", pageId: json.id ?? pageId ?? undefined };
  } catch (e) {
    return { status: "failed", error: (e instanceof Error ? e.message : "Notion request failed").slice(0, 300) };
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseSelection(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const row = toRow(parsed.value, currentMonthStart());

  // One row per person per month: submitting again (Change my actions) updates it.
  const { data: existing, error: findError } = await supabase
    .from("monthly_aram_selections")
    .select("id, notion_page_id")
    .eq("contact_key", contactKey(parsed.value.contact))
    .eq("month", row.month)
    .maybeSingle();
  if (findError) return NextResponse.json({ error: "Could not save." }, { status: 500 });

  let id: string;
  const pageId: string | null = existing?.notion_page_id ?? null;
  if (existing) {
    const { error } = await supabase.from("monthly_aram_selections").update(row).eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Could not save." }, { status: 500 });
    id = existing.id;
  } else {
    const { data, error } = await supabase.from("monthly_aram_selections").insert(row).select("id").single();
    if (error || !data) return NextResponse.json({ error: "Could not save." }, { status: 500 });
    id = data.id;
  }

  // The member's selection is already safe in Supabase; Notion is best effort.
  const notion = await syncToNotion(row, pageId);
  await supabase
    .from("monthly_aram_selections")
    .update({
      notion_status: notion.status,
      notion_page_id: notion.pageId ?? pageId,
      notion_error: notion.error ?? null,
      notion_synced_at: notion.status === "synced" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
