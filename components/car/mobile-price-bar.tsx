import { useTranslations } from "next-intl";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatRupees } from "@/lib/money";
import type { OnRoadPrice } from "@/lib/pricing/on-road-price";

type Props = { slug: string; cityName: string; quote: OnRoadPrice; exShowroomPaise: number | null };

export function MobilePriceBar({ slug, cityName, quote, exShowroomPaise }: Props) {
  const t = useTranslations("MobileBar");
  const nav = useTranslations("Nav");
  const price = quote.available
    ? { label: t("onRoadIn", { city: cityName }), paise: quote.totalPaise }
    : exShowroomPaise !== null && { label: t("exShowroom"), paise: exShowroomPaise };

  return (
    <div className="sticky bottom-0 z-30 -mx-4 flex items-center justify-between gap-4 border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-8 sm:px-8 lg:hidden">
      {price && (
        <p className="flex flex-col">
          <span className="text-xs text-muted-foreground">{price.label}</span>
          <span className="text-lg tabular-nums">{formatRupees(price.paise)}</span>
        </p>
      )}
      <Button asChild className="ml-auto">
        <Link href={`${TEST_DRIVE_HREF}?model=${slug}`}>{nav("bookTestDriveShort")}</Link>
      </Button>
    </div>
  );
}
