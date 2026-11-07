import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// A quiet pointer on a car page for a buyer who has a car to part with.
export function TradeInStrip({ slug }: { slug: string }) {
  const t = useTranslations("TradeIn");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
      <p className="text-lg">{t("stripTitle")}</p>
      <Button asChild variant="outline">
        <Link href={`/trade-in?model=${slug}`}>{t("stripLink")}</Link>
      </Button>
    </div>
  );
}
