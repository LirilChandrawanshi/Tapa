import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { AnnounceBar } from "@/components/AnnounceBar";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";
import { getFlags } from "@/lib/flags";
import "./globals.css";

const tiroDevanagari = Tiro_Devanagari_Hindi({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-tiro-devanagari",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tapa — Dharma, sourced from scripture",
    template: "%s · Tapa",
  },
  description:
    "Scripturally sourced ritual guides, live Panchang and dharmic knowledge. Not fear. Only devotion.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const flags = await getFlags();

  return (
    <html
      lang="en"
      className={`${tiroDevanagari.variable} ${notoSansDevanagari.variable}`}
    >
      <body>
        <AnnounceBar />
        <TopNav kitsLaunched={flags.kits_launched} />
        {children}
        <Footer kitsLaunched={flags.kits_launched} purohitVisible={flags.purohit_tab_visible} />
      </body>
    </html>
  );
}
