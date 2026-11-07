import type { Viewport } from "next";
import { Inter, Newsreader, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";

// Inter for text and Newsreader for the big headlines. Neither has Devanagari, so each has a Noto
// companion for Hindi; the browser only downloads a companion when a page actually uses it.
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
const devanagariSans = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari-sans" });
const devanagariSerif = Noto_Serif_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari-serif" });
const FONT_CLASSES = [sans, display, devanagariSans, devanagariSerif].map((font) => font.variable).join(" ");

// Runs before first paint so a dark-mode visitor never sees a flash of the light theme.
// A saved choice wins; otherwise the device setting decides.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){}`;

export const documentViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#111013" },
  ],
};

// The page shell shared by the public site (in either language) and the staff screens.
export function Document({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    // The theme script changes the class on <html> before React hydrates.
    <html lang={lang} className={`${FONT_CLASSES} h-full`} suppressHydrationWarning>
      {/* A root layout writes <head> itself; the App Router has no <Head>. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
