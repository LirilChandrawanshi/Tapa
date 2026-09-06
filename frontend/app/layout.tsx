import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tapa — Dharma, sourced from scripture",
    template: "%s · Tapa",
  },
  description:
    "Scripturally sourced ritual guides, live Panchang and dharmic knowledge. Not fear. Only devotion.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
