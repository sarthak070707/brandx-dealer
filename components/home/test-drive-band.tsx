import { getTranslations } from "next-intl/server";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getShowrooms } from "@/lib/catalogue";
import { formatClock } from "@/lib/dates";
import { localised } from "@/lib/i18n/content";

export async function TestDriveBand() {
  const [showrooms, t, nav, common, content] = await Promise.all([
    getShowrooms(),
    getTranslations("Home"),
    getTranslations("Nav"),
    getTranslations("Common"),
    getTranslations("Content"),
  ]);

  return (
    <section id="showrooms" aria-labelledby="test-drive-title" className="scroll-mt-20 px-4 pb-20 sm:px-8 lg:px-12 lg:pb-section">
      <div className="flex flex-wrap justify-between gap-12 rounded-3xl bg-inverse px-6 py-12 text-inverse-foreground [--ring:var(--inverse-foreground)] sm:p-16 dark:border dark:border-inverse-border">
        <div className="flex max-w-md flex-col items-start gap-5">
          <h2 id="test-drive-title" className="text-4xl leading-tight font-display tracking-tight sm:text-5xl">
            {t("bandTitle")}
          </h2>
          <p className="text-lg leading-relaxed text-inverse-muted">{t("bandBody")}</p>
          <Button asChild size="lg" className="mt-2">
            <Link href={TEST_DRIVE_HREF}>{nav("bookTestDrive")}</Link>
          </Button>
        </div>

        <ul className="flex max-w-xl flex-[1_1_22rem] flex-col">
          {showrooms.map((showroom) => (
            <li
              key={showroom.name}
              className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-inverse-border py-5 last:border-b-0"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg">{localised(content, "showrooms", showroom.name, showroom.name, "name")}</h3>
                <p className="text-sm text-inverse-muted">{localised(content, "showrooms", showroom.name, showroom.address, "address")}</p>
              </div>
              <p className="text-sm text-inverse-muted">
                {common("hours", { open: formatClock(showroom.openMinute), close: formatClock(showroom.closeMinute) })}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
