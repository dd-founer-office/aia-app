import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./partner.css";

// Cal Sans is OFL-1.1 licensed (see app/fonts/CalSans-OFL.txt), vendored
// directly from the official `cal-sans` npm package rather than loaded
// from Google Fonts, which doesn't carry it. Self-hosting via
// next/font/local is the standard, license-compliant way to ship a
// non-Google font in a Next.js app.
const calSans = localFont({
  src: "../fonts/CalSansVF.woff2",
  variable: "--font-cal-sans",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AiA Partner Portal",
  description: "Assigned activities and Mission Camera handoff for AiA field partners.",
};

// Deliberately its own font/color system (see partner.css), scoped to
// this subtree only -- the Contributor App's root layout (DM Sans/DM
// Serif/Noto Tamil) and the Ops Portal (no shared layout at all) are
// completely untouched by anything here.
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <div className={`partner-portal min-h-dvh ${calSans.variable} ${inter.variable}`}>{children}</div>;
}
