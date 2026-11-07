import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/dates";
import { localised } from "@/lib/i18n/content";
import type { UsedCarDetail } from "@/lib/used-cars/queries";

export function InspectionReport({ inspection }: { inspection: UsedCarDetail["inspection"] }) {
  const t = useTranslations("Inspection");
  const content = useTranslations("Content");
  const locale = useLocale();
  const needsAttention = inspection.checks.filter((check) => check.result === "ATTENTION").length;

  return (
    <section aria-labelledby="inspection-title" className="rounded-2xl border bg-card p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="inspection-title" className="text-2xl">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("inspectedOn", { date: formatDate(new Date(`${inspection.inspectedOn}T00:00:00Z`), locale) })}
          </p>
        </div>
        <p className="text-right">
          <span className="text-4xl font-light tabular-nums">{inspection.score}</span>
          <span className="text-muted-foreground"> / 100</span>
        </p>
      </div>
      <ul className="divide-y border-y">
        {inspection.checks.map((check) => (
          <li key={check.area} className="flex items-center justify-between gap-4 py-3">
            <span>{localised(content, "inspection", check.area, check.area)}</span>
            {check.result === "PASS" ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CircleCheckIcon aria-hidden="true" className="size-4" /> {t("passed")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium">
                <CircleAlertIcon aria-hidden="true" className="size-4" /> {t("attention")}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">
        {needsAttention === 0 ? t("allPassed") : t("needsAttention", { count: needsAttention })}
      </p>
    </section>
  );
}
