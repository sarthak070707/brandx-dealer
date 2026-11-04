import Link from "next/link";
import { EnquirySheet } from "@/components/enquiry/enquiry-sheet";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { CarPageData, CarVariant } from "@/lib/catalogue";
import { formatDate } from "@/lib/dates";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import type { OnRoadPrice } from "@/lib/pricing/on-road-price";
import { cn } from "@/lib/utils";

type Props = {
  car: CarPageData;
  variant: CarVariant;
  cityId: string;
  onCityChange: (cityId: string) => void;
  withAccessories: boolean;
  onAccessoriesChange: (included: boolean) => void;
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

export function PriceCard({ car, variant, cityId, onCityChange, withAccessories, onAccessoriesChange, quote, className }: Props) {
  const cityName = car.cities.find((city) => city.id === cityId)?.name;

  return (
    <section aria-labelledby="price-title" className={cn("flex flex-col gap-5 rounded-2xl border bg-card p-6", className)}>
      <div>
        <h2 id="price-title" className="text-2xl">
          On-road price
        </h2>
        <p className="text-sm text-muted-foreground">
          {car.name} {variant.name}, {TRANSMISSION_LABEL[variant.transmission]}, {FUEL_LABEL[variant.fuel]}
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">City</span>
        <NativeSelect value={cityId} onChange={(event) => onCityChange(event.target.value)}>
          {car.cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
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
            <Line label="Ex-showroom" amountPaise={quote.exShowroomPaise} />
            <Line label={`Road tax (${quote.roadTax.rateBasisPoints / 100}%)`} amountPaise={quote.roadTax.paise} />
            <Line label="Insurance, first year" amountPaise={quote.insurancePaise} />
            {quote.accessories && <Line label={quote.accessories.name} amountPaise={quote.accessories.paise} />}
          </dl>
        </>
      ) : (
        <div className="rounded-xl bg-muted p-4" aria-live="polite">
          <p>On-road price not available for {cityName} yet. Enquire for a quote.</p>
          {variant.exShowroomPaise !== null && (
            <p className="mt-1 text-sm text-muted-foreground">
              Ex-showroom price: {formatRupees(variant.exShowroomPaise)}
            </p>
          )}
        </div>
      )}

      {car.accessoryPackage && (
        <label className="flex cursor-pointer gap-3">
          <input
            type="checkbox"
            checked={withAccessories}
            onChange={(event) => onAccessoriesChange(event.target.checked)}
            className="mt-1 size-4 accent-foreground"
          />
          <span className="flex flex-col">
            <span>
              Add {car.accessoryPackage.name} ({formatRupees(car.accessoryPackage.pricePaise)})
            </span>
            <span className="text-sm text-muted-foreground">{car.accessoryPackage.items.join(", ")}</span>
          </span>
        </label>
      )}

      {quote.available && (
        <p className="text-sm text-muted-foreground">
          Price valid until {formatDate(quote.validUntil)}. Prices may change.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href={`${TEST_DRIVE_HREF}?model=${car.slug}`}>Book a test drive</Link>
        </Button>
        <EnquirySheet
          target={{ type: "model", modelSlug: car.slug, variantId: variant.id, cityId, showrooms: car.showrooms }}
          carLabel={`${car.name} ${variant.name}`}
          label="Enquire"
          size="lg"
        />
      </div>
    </section>
  );
}
