import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import "./globals.css";

// AiA Frontend Architecture v1.0 §"Fonts": DM Serif Display (display/wordmark)
// + DM Sans (body/UI). Tamil variants (Noto Serif/Sans Tamil) are wired the
// same way when Tamil-script content is present; omitted here since this
// screen's locked copy is English-only (CA-014A).
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  weight: "400",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AiA — Aram in Action",
  description: "Help people practise Aram through verified acts of impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-(--color-aia-background)">
        {children}
      </body>
    </html>
  );
}
