"use client";

import { useRef, useState } from "react";
import { ColourPicker } from "@/components/car/colour-picker";
import { MorphGallery, type MorphGalleryHandle } from "@/components/car/morph-gallery";
import { MobilePriceBar } from "@/components/car/mobile-price-bar";
import { PriceCard } from "@/components/car/price-card";
import { SpecList } from "@/components/car/spec-list";
import { VariantPicker } from "@/components/car/variant-picker";
import type { CarPageData } from "@/lib/catalogue";
import { formatRupees } from "@/lib/money";

// One grid in mobile reading order; on desktop the price card moves to a sticky right column.
// The mobile price bar sticks to the viewport only while this grid is on screen, so it
// never covers the footer.
export function CarConfigurator({ car }: { car: CarPageData }) {
  const [variantId, setVariantId] = useState(car.variants[0].id);
  const [cityId, setCityId] = useState(car.defaultCityId);
  const [photoIndex, setPhotoIndex] = useState(0);
  const gallery = useRef<MorphGalleryHandle>(null);
  const [withAccessories, setWithAccessories] = useState(false);

  const variant = car.variants.find((option) => option.id === variantId) ?? car.variants[0];
  // Each colour has its own photo, so the photo on show decides the colour (and vice versa).
  const colour = variant.colours.find((option) => option.photo === car.photos[photoIndex]) ?? variant.colours[0];
  const photos = car.photos.map((src) => {
    const shown = variant.colours.find((option) => option.photo === src);
    return { src, alt: shown ? `${car.name} in ${shown.name}` : car.name };
  });
  const quote = variant.quotes[cityId][withAccessories ? "withAccessories" : "withoutAccessories"];
  const prices = car.variants.flatMap((option) => (option.exShowroomPaise === null ? [] : [option.exShowroomPaise]));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
      <div className="lg:col-start-1">
        <MorphGallery ref={gallery} label={`${car.name} photos`} photos={photos} onActiveChange={setPhotoIndex} />
      </div>

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

      <MobilePriceBar
        slug={car.slug}
        cityName={car.cities.find((city) => city.id === cityId)?.name ?? ""}
        quote={quote}
        exShowroomPaise={variant.exShowroomPaise}
      />
    </div>
  );
}
