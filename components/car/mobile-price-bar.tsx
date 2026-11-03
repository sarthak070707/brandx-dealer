import Link from "next/link";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/money";
import type { OnRoadPrice } from "@/lib/pricing/on-road-price";

type Props = { slug: string; cityName: string; quote: OnRoadPrice; exShowroomPaise: number | null };

export function MobilePriceBar({ slug, cityName, quote, exShowroomPaise }: Props) {
  const price = quote.available
    ? { label: `On-road, ${cityName}`, paise: quote.totalPaise }
    : exShowroomPaise !== null && { label: "Ex-showroom", paise: exShowroomPaise };

  return (
    <div className="sticky bottom-0 z-30 -mx-4 flex items-center justify-between gap-4 border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-8 sm:px-8 lg:hidden">
      {price && (
        <p className="flex flex-col">
          <span className="text-xs text-muted-foreground">{price.label}</span>
          <span className="text-lg tabular-nums">{formatRupees(price.paise)}</span>
        </p>
      )}
      <Button asChild className="ml-auto">
        <Link href={`${TEST_DRIVE_HREF}?model=${slug}`}>Book test drive</Link>
      </Button>
    </div>
  );
}
