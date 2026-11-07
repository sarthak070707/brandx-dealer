import type { Viewport } from "next";
import { Anek_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import "@/app/globals.css";

// One family for both scripts, so Hindi pages look like the same brand. The width axis
// lets headlines run narrower than body text.
const anek = Anek_Devanagari({
  subsets: ["latin", "devanagari"],
  axes: ["wdth"],
  variable: "--font-anek",
});

// Runs before first paint so a dark-mode visitor never sees a flash of the light theme.
// A saved choice wins; otherwise the device setting decides.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches)}catch(e){}`;

export const documentViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

// The page shell shared by the public site (in either language) and the staff screens.
export function Document({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    // The theme script changes the class on <html> before React hydrates.
    <html lang={lang} className={`${anek.variable} h-full`} suppressHydrationWarning>
      {/* A root layout writes <head> itself; the App Router has no <Head>. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
