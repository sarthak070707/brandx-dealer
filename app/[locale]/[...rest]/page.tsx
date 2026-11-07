import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { NotFoundPage } from "@/components/not-found-page";

// This page only ever answers "not found", so it may wait for the request instead of having a
// pre-built shell, and it tells search engines not to list it.
export const instant = false;

export const metadata: Metadata = { robots: { index: false } };

// Any address under a language that matches no page lands here.
export default async function UnknownPage({ params }: PageProps<"/[locale]/[...rest]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotFoundPage />;
}
