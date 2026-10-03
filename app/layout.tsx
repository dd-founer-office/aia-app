import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import LivingField from "@/components/field/LivingField";

// Self-hosted (next/font/local) rather than next/font/google -- these were
// all hitting an intermittent Vercel/Turbopack build failure fetching font
// files from Google's servers at build time ("Module not found: Can't
// resolve '@vercel/turbopack-next/internal/font/google/font'"). Each .woff2
// below is the exact same variable-font file next/font/google would itself
// have downloaded and bundled, fetched once and committed instead, so the
// build no longer depends on that network call at all. Same approach
// CalSans already used (see app/fonts/CalSans-OFL.txt) -- every one of
// these fonts is OFL-licensed, so self-hosting is license-compliant.
const dmSerifDisplay = localFont({
  src: "./fonts/DMSerifDisplay.woff2",
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const dmSans = localFont({
  src: "./fonts/DMSansVF.woff2",
  weight: "100 1000",
  variable: "--font-sans",
  display: "swap",
});

const notoSansTamil = localFont({
  src: "./fonts/NotoSansTamilVF.woff2",
  weight: "100 900",
  variable: "--font-tamil-sans",
  display: "swap",
});

const notoSerifTamil = localFont({
  src: "./fonts/NotoSerifTamilVF.woff2",
  weight: "100 900",
  variable: "--font-tamil-serif",
  display: "swap",
});

const notoSansBrahmi = localFont({
  src: "./fonts/NotoSansBrahmi.woff2",
  weight: "400",
  variable: "--font-brahmi",
  display: "swap",
});

const notoSerif = localFont({
  src: "./fonts/NotoSerifVF.woff2",
  weight: "100 900",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aram in Action",
  description: "Help people live Aram through verified acts of impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${dmSans.variable} ${dmSerifDisplay.variable} ${notoSansTamil.variable} ${notoSerifTamil.variable} ${notoSerif.variable} ${notoSansBrahmi.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <LivingField />
        {children}
      </body>
    </html>
  );
}
