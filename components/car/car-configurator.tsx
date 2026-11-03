"use client";

import { useState, type ReactNode } from "react";
import { ColourPicker } from "@/components/car/colour-picker";
import { MobilePriceBar } from "@/components/car/mobile-price-bar";
import { PriceCard } from "@/components/car/price-card";
import { SpecList } from "@/components/car/spec-list";
import { VariantPicker } from "@/components/car/variant-picker";
import type { CarPageData } from "@/lib/catalogue";
import { formatRupees } from "@/lib/money";

// One grid in mobile reading order; on desktop the price card moves to a sticky right column.
// The mobile price bar sticks to the viewport only while this grid is on screen, so it
// never covers the footer.
export function CarConfigurator({ car, gallery }: { car: CarPageData; gallery: ReactNode }) {
  const [variantId, setVariantId] = useState(car.variants[0].id);
  const [cityId, setCityId] = useState(car.defaultCityId);
  const [colourName, setColourName] = useState(car.variants[0].colours[0]?.name);
  const [withAccessories, setWithAccessories] = useState(false);

  const variant = car.variants.find((option) => option.id === variantId) ?? car.variants[0];
  const colour = variant.colours.find((option) => option.name === colourName) ?? variant.colours[0];
  const quote = variant.quotes[cityId][withAccessories ? "withAccessories" : "withoutAccessories"];
  const prices = car.variants.flatMap((option) => (option.exShowroomPaise === null ? [] : [option.exShowroomPaise]));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
      <div className="lg:col-start-1">{gallery}</div>

      <header className="flex flex-col gap-2 lg:col-start-1">
        <h1 className="text-5xl leading-none font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">{car.name}</h1>
        <p className="text-lg text-muted-foreground">
          {prices.length > 0 && `From ${formatRupees(Math.min(...prices))} ex-showroom, `}
          {car.variants.length} {car.variants.length === 1 ? "variant" : "variants"}
        </p>
        <p className="max-w-prose">{car.description}</p>
      </header>

      <div className="lg:col-start-1">
        <VariantPicker variants={car.variants} selectedId={variant.id} onSelect={setVariantId} />
      </div>

      <PriceCard
        car={car}
        variant={variant}
        cityId={cityId}
        onCityChange={setCityId}
        withAccessories={withAccessories}
        onAccessoriesChange={setWithAccessories}
        quote={quote}
        className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:self-start"
      />

      {colour && (
        <div className="lg:col-start-1">
          <ColourPicker colours={variant.colours} selected={colour} onSelect={setColourName} />
        </div>
      )}

      <div className="lg:col-start-1">
        <SpecList variant={variant} />
      </div>

      <MobilePriceBar
        slug={car.slug}
        cityName={car.cities.find((city) => city.id === cityId)?.name ?? ""}
        quote={quote}
        exShowroomPaise={variant.exShowroomPaise}
      />
    </div>
  );
}
