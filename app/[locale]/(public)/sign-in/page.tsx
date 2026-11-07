import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { SignInForm } from "@/app/[locale]/(public)/sign-in/sign-in-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SignIn" });
  return { title: t("metaTitle"), robots: { index: false } };
}

async function SignInCard({ searchParams }: { searchParams: PageProps<"/[locale]/sign-in">["searchParams"] }) {
  const { callbackUrl } = await searchParams;
  return <SignInForm redirectTo={typeof callbackUrl === "string" ? callbackUrl : undefined} />;
}

export default async function SignInPage({ params, searchParams }: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("SignIn");

  return (
    <main className="px-4 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-display tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("lead")}</p>
        </div>
        <Suspense fallback={<div aria-hidden="true" className="h-72 animate-pulse rounded-2xl bg-muted" />}>
          <SignInCard searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
