import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftPage } from "@/components/heritage/vaazhga/GiftPage";
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
  searchParams: Promise<{ preview?: string; m?: string | string[] }>;
}) {
  const { slug } = await params;
  const { preview, m } = await searchParams;
  const report = getVaazhgaReportByGiftSlug(slug);
  if (!report) notFound();
  // The sender's personal message travels in the link (?m=...), as plain text.
  const message = cleanMessage(Array.isArray(m) ? m[0] : m);
  return <GiftPage report={report} preview={preview === "1"} message={message} />;
}
