import { useLocale, useTranslations } from "next-intl";
import { EnquirySheet } from "@/components/enquiry/enquiry-sheet";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Link } from "@/i18n/navigation";
import type { CarPageData, CarVariant } from "@/lib/catalogue";
import { formatDate } from "@/lib/dates";
import { localised } from "@/lib/i18n/content";
import { formatRupees } from "@/lib/money";
import type { OnRoadPrice } from "@/lib/pricing/on-road-price";
import { cn } from "@/lib/utils";

type Props = {
  car: CarPageData;
  variant: CarVariant;
  cityId: string;
  onCityChange: (cityId: string) => void;
  selectedPackIds: string[];
  onPackToggle: (id: string) => void;
  quote: OnRoadPrice;
  className?: string;
};

function Line({ label, amountPaise }: { label: string; amountPaise: number }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{formatRupees(amountPaise)}</dd>
    </div>
  );
}

export function PriceCard({ car, variant, cityId, onCityChange, selectedPackIds, onPackToggle, quote, className }: Props) {
  const t = useTranslations("Price");
  const labels = useTranslations("Labels");
  const content = useTranslations("Content");
  const nav = useTranslations("Nav");
  const locale = useLocale();

  const cityName = (name: string) => localised(content, "cities", name, name);
  const selectedCity = cityName(car.cities.find((city) => city.id === cityId)?.name ?? "");

  return (
    <section aria-labelledby="price-title" className={cn("flex flex-col gap-4 rounded-2xl border bg-card p-5", className)}>
      {/* On a short screen the details can still scroll inside the card, without a visible bar, and the two buttons below stay in view. */}
      <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
        <div>
          <h2 id="price-title" className="text-2xl">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {car.name} {variant.name}, {labels(`transmission.${variant.transmission}`)}, {labels(`fuel.${variant.fuel}`)}
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{t("city")}</span>
          <NativeSelect value={cityId} onChange={(event) => onCityChange(event.target.value)}>
            {car.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {cityName(city.name)}
              </option>
            ))}
          </NativeSelect>
        </label>

        {quote.available ? (
          <>
            <p className="text-4xl font-light tracking-tight tabular-nums" aria-live="polite">
              {formatRupees(quote.totalPaise)}
            </p>
            <dl className="divide-y border-y">
              <Line label={t("exShowroom")} amountPaise={quote.exShowroomPaise} />
              <Line label={t("roadTax", { rate: quote.roadTax.rateBasisPoints / 100 })} amountPaise={quote.roadTax.paise} />
              <Line label={t("insurance")} amountPaise={quote.insurancePaise} />
              {quote.accessories.map((pack) => (
                <Line key={pack.name} label={localised(content, "packs", pack.name, pack.name)} amountPaise={pack.paise} />
              ))}
            </dl>
          </>
        ) : (
          <div className="rounded-xl bg-muted p-4" aria-live="polite">
            <p>{t("unavailable", { city: selectedCity })}</p>
            {variant.exShowroomPaise !== null && (
              <p className="mt-1 text-sm text-muted-foreground">{t("exShowroomPrice", { price: formatRupees(variant.exShowroomPaise) })}</p>
            )}
          </div>
        )}

        {car.accessoryPackages.length > 0 && (
          <div className="flex flex-col gap-4">
            {car.accessoryPackages.map((pack) => (
              <label key={pack.id} className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  checked={selectedPackIds.includes(pack.id)}
                  onChange={() => onPackToggle(pack.id)}
                  className="mt-1 size-4 accent-foreground"
                />
                <span className="flex flex-col">
                  <span>{t("addAccessories", { name: localised(content, "packs", pack.name, pack.name), price: formatRupees(pack.paise) })}</span>
                  <span className="text-sm text-muted-foreground">{pack.items.map((item) => localised(content, "items", item, item)).join(", ")}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {quote.available && <p className="text-sm text-muted-foreground">{t("valid", { date: formatDate(quote.validUntil, locale) })}</p>}
      </div>

      <div className="flex shrink-0 flex-col gap-3">
        <Button asChild size="lg">
          <Link href={`${TEST_DRIVE_HREF}?model=${car.slug}`}>{nav("bookTestDrive")}</Link>
        </Button>
        <EnquirySheet
          target={{ type: "model", modelSlug: car.slug, variantId: variant.id, cityId, showrooms: car.showrooms }}
          carLabel={`${car.name} ${variant.name}`}
          label={t("enquire")}
          size="lg"
        />
      </div>
    </section>
  );
}
