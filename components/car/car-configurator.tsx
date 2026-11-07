"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ColourPicker } from "@/components/car/colour-picker";
import { MorphGallery, type MorphGalleryHandle } from "@/components/car/morph-gallery";
import { MobilePriceBar } from "@/components/car/mobile-price-bar";
import { PriceCard } from "@/components/car/price-card";
import { SpecList } from "@/components/car/spec-list";
import { TradeInStrip } from "@/components/car/trade-in-strip";
import { VariantPicker } from "@/components/car/variant-picker";
import { EmiCalculator } from "@/components/finance/emi-calculator";
import type { CarPageData } from "@/lib/catalogue";
import { localised } from "@/lib/i18n/content";
import { formatRupees } from "@/lib/money";
import { withPacks } from "@/lib/pricing/on-road-price";
import { toggleItem } from "@/lib/utils";

// One grid in mobile reading order; on desktop the price card moves to a sticky right column.
// The mobile price bar sticks to the viewport only while this grid is on screen, so it
// never covers the footer.
export function CarConfigurator({ car }: { car: CarPageData }) {
  const t = useTranslations("Car");
  const content = useTranslations("Content");
  const [variantId, setVariantId] = useState(car.variants[0].id);
  const [cityId, setCityId] = useState(car.defaultCityId);
  const [photoIndex, setPhotoIndex] = useState(0);
  const gallery = useRef<MorphGalleryHandle>(null);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);

  const variant = car.variants.find((option) => option.id === variantId) ?? car.variants[0];
  // Each colour has its own photo, so the photo on show decides the colour (and vice versa).
  const colour = variant.colours.find((option) => option.photo === car.photos[photoIndex]) ?? variant.colours[0];
  const photos = car.photos.map((src) => {
    const shown = variant.colours.find((option) => option.photo === src);
    return { src, alt: shown ? t("photoAlt", { name: car.name, colour: localised(content, "colours", shown.name, shown.name) }) : car.name };
  });
  // The packs belong to the car, not the variant, so a buyer's ticks stay when they change variant or city.
  const base = variant.quotes[cityId];
  const quote = base.available ? withPacks(base, car.accessoryPackages.filter((pack) => selectedPackIds.includes(pack.id))) : base;
  const description = localised(content, "models", car.slug, car.description);
  const cityName = car.cities.find((city) => city.id === cityId)?.name ?? "";
  // The on-road price when there is one for this city, otherwise the ex-showroom price.
  const emiBasePaise = quote.available ? quote.totalPaise : variant.exShowroomPaise;
  const prices = car.variants.flatMap((option) => (option.exShowroomPaise === null ? [] : [option.exShowroomPaise]));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
      <div className="lg:col-start-1">
        <MorphGallery ref={gallery} label={t("galleryLabel", { name: car.name })} photos={photos} onActiveChange={setPhotoIndex} />
      </div>

      <header className="flex flex-col gap-2 lg:col-start-1">
        <h1 className="text-5xl leading-none font-display tracking-tight sm:text-6xl">{car.name}</h1>
        <p className="text-lg text-muted-foreground">
          {prices.length > 0
            ? t("fromPriceVariants", { price: formatRupees(Math.min(...prices)), count: car.variants.length })
            : t("variantsCount", { count: car.variants.length })}
        </p>
        <p className="max-w-prose">{description}</p>
      </header>

      <div className="lg:col-start-1">
        <VariantPicker variants={car.variants} selectedId={variant.id} onSelect={setVariantId} />
      </div>

      <PriceCard
        car={car}
        variant={variant}
        cityId={cityId}
        onCityChange={setCityId}
        selectedPackIds={selectedPackIds}
        onPackToggle={(id) => setSelectedPackIds(toggleItem(selectedPackIds, id))}
        quote={quote}
        className="lg:sticky lg:top-20 lg:col-start-2 lg:row-span-7 lg:row-start-1 lg:max-h-[calc(100dvh-6rem)] lg:self-start"
      />

      {colour && (
        // Start loading the dissolve as soon as the buyer reaches for a swatch.
        <div className="lg:col-start-1" onPointerEnter={() => gallery.current?.prepare()} onFocus={() => gallery.current?.prepare()}>
          <ColourPicker
            colours={variant.colours}
            selected={colour}
            onSelect={(picked) => gallery.current?.show(Math.max(car.photos.indexOf(picked.photo), 0))}
          />
        </div>
      )}

      <div className="lg:col-start-1">
        <SpecList variant={variant} />
      </div>

      {emiBasePaise !== null && (
        <div className="lg:col-start-1">
          <EmiCalculator pricePaise={emiBasePaise} />
        </div>
      )}

      <div className="lg:col-start-1">
        <TradeInStrip slug={car.slug} />
      </div>

      <MobilePriceBar
        slug={car.slug}
        cityName={localised(content, "cities", cityName, cityName)}
        quote={quote}
        exShowroomPaise={variant.exShowroomPaise}
      />
    </div>
  );
}
