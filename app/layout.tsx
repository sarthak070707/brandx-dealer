import type { Metadata, Viewport } from "next";
import { Anek_Devanagari } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// One family for both scripts, so Hindi pages look like the same brand. The width axis
// lets headlines run narrower than body text.
const anek = Anek_Devanagari({
  subsets: ["latin", "devanagari"],
  axes: ["wdth"],
  variable: "--font-anek",
});

export const metadata: Metadata = {
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
    // next-themes sets the theme class on <html> before React hydrates, so the attribute differs.
    <html lang="en" className={`${anek.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
