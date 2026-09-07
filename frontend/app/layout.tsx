import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import { AnalyticsLoader } from "@/components/AnalyticsLoader";
import { AnnounceBar } from "@/components/AnnounceBar";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";
import { getFlags } from "@/lib/flags";
import "./globals.css";

/**
 * Primary Devanagari face — the wordmark तप् and all `font-devanagari`
 * text render in this. Preloaded: it is above the fold on every page
 * (TopNav logo), and its two subsets are small (~84KB total).
 */
const tiroDevanagari = Tiro_Devanagari_Hindi({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-tiro-devanagari",
  display: "swap",
});

/**
 * Fallback-only face: `--font-devanagari` always tries Tiro first, so Noto
 * is fetched only for glyphs Tiro lacks. `preload: false` keeps its ~121KB
 * Devanagari subset out of the critical request graph (it was the single
 * biggest contributor to simulated mobile LCP); the @font-face rule still
 * ships, so the browser lazily fetches it if it is ever actually needed.
 * Latin subset dropped — Tiro already covers Latin inside Devanagari runs.
 */
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
  display: "swap",
  preload: false,
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
        <AnalyticsLoader />
        <AnnounceBar />
        <TopNav kitsLaunched={flags.kits_launched} />
        {children}
        <Footer kitsLaunched={flags.kits_launched} purohitVisible={flags.purohit_tab_visible} mandaliVisible={flags.mandali_visible} />
      </body>
    </html>
  );
}
