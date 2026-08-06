import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, Noto_Sans_Tamil, Noto_Serif_Tamil, Noto_Serif, Noto_Sans_Brahmi } from "next/font/google";
import "./globals.css";
import LivingField from "@/components/field/LivingField";

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

const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "700"],
  variable: "--font-tamil-serif",
});

const notoSansBrahmi = Noto_Sans_Brahmi({
  subsets: ["brahmi"],
  weight: "400",
  variable: "--font-brahmi",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-serif",
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
