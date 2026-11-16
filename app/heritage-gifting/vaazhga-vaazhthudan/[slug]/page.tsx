import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VaazhgaReport } from "@/components/heritage/vaazhga/VaazhgaReport";
import { getVaazhgaReport } from "@/lib/heritage/vaazhga-vaazhthudan-reports";

// Private, no-sign-in page for one blessing: reached only through its
// unguessable link, never indexed, and its metadata carries nothing personal.
export const metadata: Metadata = {
  title: "Vaazhga Vaazhthudan | Distant Devotion",
  description: "Connecting Hearts and Roots.",
  robots: { index: false, follow: false },
};

// Reports are a fixed registry: an unknown slug is a 404, never a render.
export const dynamicParams = true;

export default async function VaazhgaReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = getVaazhgaReport(slug);
  if (!report) notFound();
  return <VaazhgaReport report={report} />;
}
