import type { Metadata, Viewport } from "next";
import { Anek_Devanagari } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Brand X Lucknow",
  description: "New and certified used Brand X cars in Lucknow, with on-road prices and test drives.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script changes the class on <html> before React hydrates.
    <html lang="en" className={`${anek.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
