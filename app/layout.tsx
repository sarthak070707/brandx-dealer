import type { Metadata, Viewport } from "next";
import { Anek_Devanagari } from "next/font/google";
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
  themeColor: "#f7f4ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anek.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
