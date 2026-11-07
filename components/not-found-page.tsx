import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// The translated "Page not found" page with the site menu, shared by every kind of not-found.
export async function NotFoundPage() {
  const t = await getTranslations("NotFound");

  return (
    <>
      <SiteHeader />
      <main className="flex flex-col items-start gap-6 px-4 py-16 sm:px-8 lg:px-12 lg:pb-section">
        <h1 className="text-5xl font-display tracking-tight sm:text-6xl">{t("title")}</h1>
        <p className="max-w-prose text-lg text-muted-foreground">{t("body")}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/cars">{t("allModels")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/used-cars">{t("usedCars")}</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
