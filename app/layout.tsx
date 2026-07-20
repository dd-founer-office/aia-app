import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500"],
  variable: "--font-tamil-sans",
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
      className={`h-full antialiased ${dmSans.variable} ${dmSerifDisplay.variable} ${notoSansTamil.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
