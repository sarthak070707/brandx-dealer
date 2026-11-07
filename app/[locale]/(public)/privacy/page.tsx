import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesFor } from "@/lib/seo";

const SECTIONS = ["collect", "why", "who", "ai", "messages", "choices", "consent"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: alternatesFor("/privacy", locale) };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-5xl font-display tracking-tight sm:text-6xl">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("lead")}</p>
      </div>
      <div className="flex max-w-2xl flex-col gap-8">
        {SECTIONS.map((section) => (
          <section key={section} aria-labelledby={`privacy-${section}`}>
            <h2 id={`privacy-${section}`} className="mb-2 text-2xl">
              {t(`sections.${section}.title`)}
            </h2>
            <p className="text-lg text-muted-foreground">{t(`sections.${section}.body`)}</p>
          </section>
        ))}
        <p className="text-sm text-muted-foreground">{t("note")}</p>
      </div>
    </main>
  );
}
