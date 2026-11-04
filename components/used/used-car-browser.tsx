"use client";

import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterPanel, type FilterOptions } from "@/components/used/filter-panel";
import { UsedCarCard } from "@/components/used/used-car-card";
import { FUEL_LABEL } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import { activeFilterCount, findUsedCars, NO_FILTERS, type UsedCarFilters, type UsedCarSort } from "@/lib/used-cars/filter";
import type { UsedCarCard as UsedCar } from "@/lib/used-cars/queries";

const SORT_LABELS: Record<UsedCarSort, string> = {
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  "year-desc": "Newest first",
  "km-asc": "Lowest km first",
};

const kmFormat = new Intl.NumberFormat("en-IN");

function filterChips(filters: UsedCarFilters, options: FilterOptions) {
  const modelName = (slug: string) => options.models.find((model) => model.slug === slug)?.name ?? slug;
  return [
    ...filters.modelSlugs.map((slug) => ({
      label: modelName(slug),
      clear: { ...filters, modelSlugs: filters.modelSlugs.filter((item) => item !== slug) },
    })),
    ...filters.fuels.map((fuel) => ({
      label: FUEL_LABEL[fuel],
      clear: { ...filters, fuels: filters.fuels.filter((item) => item !== fuel) },
    })),
    ...(filters.yearFrom !== null ? [{ label: `From ${filters.yearFrom}`, clear: { ...filters, yearFrom: null } }] : []),
    ...(filters.yearTo !== null ? [{ label: `Up to ${filters.yearTo}`, clear: { ...filters, yearTo: null } }] : []),
    ...(filters.priceRangePaise
      ? [{
          label: `${formatRupees(filters.priceRangePaise[0])} to ${formatRupees(filters.priceRangePaise[1])}`,
          clear: { ...filters, priceRangePaise: null },
        }]
      : []),
    ...(filters.maxKm !== null ? [{ label: `Up to ${kmFormat.format(filters.maxKm)} km`, clear: { ...filters, maxKm: null } }] : []),
  ];
}

export function UsedCarBrowser({ cars, options }: { cars: UsedCar[]; options: FilterOptions }) {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState<UsedCarSort>("price-asc");

  const results = findUsedCars(cars, filters, sort);
  const chips = filterChips(filters, options);
  const panel = <FilterPanel options={options} filters={filters} onChange={setFilters} />;

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-24">{panel}</div>
      </aside>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite">
            {results.length} {results.length === 1 ? "car" : "cars"}
          </p>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontalIcon />
                  Filters{activeFilterCount(filters) > 0 && ` (${activeFilterCount(filters)})`}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetTitle className="mb-6 text-lg">Filters</SheetTitle>
                {panel}
              </SheetContent>
            </Sheet>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only sm:text-muted-foreground">Sort</span>
              <NativeSelect value={sort} onChange={(event) => setSort(event.target.value as UsedCarSort)} className="w-auto">
                {Object.entries(SORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </label>
          </div>
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((chip) => (
              <li key={chip.label}>
                <button
                  type="button"
                  aria-label={`Remove filter: ${chip.label}`}
                  onClick={() => setFilters(chip.clear)}
                  className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {chip.label}
                  <XIcon aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
            <li>
              <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)}>
                Clear all
              </Button>
            </li>
          </ul>
        )}

        {results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((car) => (
              <li key={car.stockId}>
                <UsedCarCard car={car} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-8">
            <p className="text-lg">No cars match these filters.</p>
            <p className="text-muted-foreground">New stock arrives every week. Try widening the price or km range.</p>
            <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
