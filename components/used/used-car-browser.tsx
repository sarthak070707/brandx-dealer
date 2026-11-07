"use client";

import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterPanel, type FilterOptions } from "@/components/used/filter-panel";
import { UsedCarCard } from "@/components/used/used-car-card";
import { formatRupees } from "@/lib/money";
import { activeFilterCount, findUsedCars, NO_FILTERS, type UsedCarFilters, type UsedCarSort } from "@/lib/used-cars/filter";
import type { UsedCarCard as UsedCar } from "@/lib/used-cars/queries";

const SORT_ORDERS: UsedCarSort[] = ["price-asc", "price-desc", "year-desc", "km-asc"];

const kmFormat = new Intl.NumberFormat("en-IN");

type Translate = ReturnType<typeof useTranslations>;

function filterChips(filters: UsedCarFilters, options: FilterOptions, t: Translate, labels: Translate) {
  const modelName = (slug: string) => options.models.find((model) => model.slug === slug)?.name ?? slug;
  return [
    ...filters.modelSlugs.map((slug) => ({
      label: modelName(slug),
      clear: { ...filters, modelSlugs: filters.modelSlugs.filter((item) => item !== slug) },
    })),
    ...filters.fuels.map((fuel) => ({
      label: labels(`fuel.${fuel}`),
      clear: { ...filters, fuels: filters.fuels.filter((item) => item !== fuel) },
    })),
    ...(filters.yearFrom !== null ? [{ label: t("fromYear", { year: filters.yearFrom }), clear: { ...filters, yearFrom: null } }] : []),
    ...(filters.yearTo !== null ? [{ label: t("upToYear", { year: filters.yearTo }), clear: { ...filters, yearTo: null } }] : []),
    ...(filters.priceRangePaise
      ? [{
          label: t("range", { min: formatRupees(filters.priceRangePaise[0]), max: formatRupees(filters.priceRangePaise[1]) }),
          clear: { ...filters, priceRangePaise: null },
        }]
      : []),
    ...(filters.maxKm !== null ? [{ label: t("upToKm", { km: kmFormat.format(filters.maxKm) }), clear: { ...filters, maxKm: null } }] : []),
  ];
}

export function UsedCarBrowser({ cars, options }: { cars: UsedCar[]; options: FilterOptions }) {
  const t = useTranslations("UsedBrowser");
  const labels = useTranslations("Labels");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sort, setSort] = useState<UsedCarSort>("price-asc");

  const results = findUsedCars(cars, filters, sort);
  const chips = filterChips(filters, options, t, labels);
  const panel = <FilterPanel options={options} filters={filters} onChange={setFilters} />;

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label={t("filters")} className="hidden lg:block">
        <div className="sticky top-24">{panel}</div>
      </aside>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite">
            {t("count", { count: results.length })}
          </p>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontalIcon />
                  {activeFilterCount(filters) > 0 ? t("filtersCount", { count: activeFilterCount(filters) }) : t("filters")}
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetTitle className="mb-6 text-lg">{t("filters")}</SheetTitle>
                {panel}
              </SheetContent>
            </Sheet>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only sm:text-muted-foreground">{t("sort")}</span>
              <NativeSelect value={sort} onChange={(event) => setSort(event.target.value as UsedCarSort)} className="w-auto">
                {SORT_ORDERS.map((order) => (
                  <option key={order} value={order}>
                    {t(`sortOptions.${order}`)}
                  </option>
                ))}
              </NativeSelect>
            </label>
          </div>
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2" aria-label={t("activeFilters")}>
            {chips.map((chip) => (
              <li key={chip.label}>
                <button
                  type="button"
                  aria-label={t("remove", { label: chip.label })}
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
                {t("clearAll")}
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
            <p className="text-lg">{t("noMatch")}</p>
            <p className="text-muted-foreground">{t("noMatchHint")}</p>
            <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
              {t("clearFilters")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
