import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftPage } from "@/components/heritage/vaazhga/GiftPage";
import { defaultSenders, parseSenders } from "@/lib/heritage/vaazhga-senders";
import { cleanMessage, getVaazhgaReportByGiftSlug } from "@/lib/heritage/vaazhga-vaazhthudan-reports";

// The page the birthday person sees: reached only through its own
// unguessable link (separate from the booker's report), never indexed.
export const metadata: Metadata = {
  title: "A blessing for you | Distant Devotion",
  description: "Connecting Hearts and Roots.",
  robots: { index: false, follow: false },
};

export default async function VaazhgaGiftPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; m?: string | string[]; f?: string | string[] }>;
}) {
  const { slug } = await params;
  const { preview, m, f } = await searchParams;
  const report = getVaazhgaReportByGiftSlug(slug);
  if (!report) notFound();
  // The sender's personal message travels in the link (?m=...), as plain text.
  const message = cleanMessage(Array.isArray(m) ? m[0] : m);
  // Who it is from travels as repeated ?f=name~relation; the booking's own sender is the fallback.
  const named = parseSenders(f);
  const senders = named.length ? named : defaultSenders(report);
  return <GiftPage report={report} preview={preview === "1"} message={message} senders={senders} />;
}
