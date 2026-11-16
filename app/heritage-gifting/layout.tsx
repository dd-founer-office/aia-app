import localFont from "next/font/local";

// Heritage Gifting has its own identity (maroon + orange, Cal Sans + Inter),
// separate from Aram in Action. Fonts are self-hosted like everywhere else
// in this app (see app/layout.tsx and app/partner/layout.tsx for why).
const calSans = localFont({
  src: "../fonts/CalSansVF.woff2",
  variable: "--hg-cal",
  weight: "100 900",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/InterVF.woff2",
  variable: "--hg-inter",
  weight: "100 900",
  display: "swap",
});

export default function HeritageGiftingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${calSans.variable} ${inter.variable}`}>{children}</div>;
}
