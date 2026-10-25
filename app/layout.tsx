import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./notch.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "800"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Vesper: know when to trade and when not to",
  description:
    "Vesper turns the MacBook notch into a live trading cockpit: your session window, news countdown and blackout, pre-trade checklist and position size. No signals, no predictions. Free beta for Mac.",
  openGraph: { title: "Vesper for Mac", description: "Know when to trade and when not to, right at the notch.", type: "website" },
};
export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
