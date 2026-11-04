import type { Fuel } from "@/generated/prisma/enums";

export type UsedCarListing = {
  stockId: string;
  modelSlug: string;
  modelName: string;
  variantName: string;
  fuel: Fuel;
  year: number;
  km: number;
  pricePaise: number;
};

export type UsedCarFilters = {
  modelSlugs: string[];
  fuels: Fuel[];
  yearFrom: number | null;
  yearTo: number | null;
  priceRangePaise: [number, number] | null;
  maxKm: number | null;
};

export type UsedCarSort = "price-asc" | "price-desc" | "year-desc" | "km-asc";

export const NO_FILTERS: UsedCarFilters = {
  modelSlugs: [],
  fuels: [],
  yearFrom: null,
  yearTo: null,
  priceRangePaise: null,
  maxKm: null,
};

// An empty list means "any", so a buyer who ticks nothing sees everything.
const allows = <T>(selected: T[], value: T) => selected.length === 0 || selected.includes(value);

export function matchesFilters(car: UsedCarListing, filters: UsedCarFilters) {
  const [minPrice, maxPrice] = filters.priceRangePaise ?? [-Infinity, Infinity];
  return (
    allows(filters.modelSlugs, car.modelSlug) &&
    allows(filters.fuels, car.fuel) &&
    car.year >= (filters.yearFrom ?? -Infinity) &&
    car.year <= (filters.yearTo ?? Infinity) &&
    car.pricePaise >= minPrice &&
    car.pricePaise <= maxPrice &&
    car.km <= (filters.maxKm ?? Infinity)
  );
}

const SORTERS: Record<UsedCarSort, (a: UsedCarListing, b: UsedCarListing) => number> = {
  "price-asc": (a, b) => a.pricePaise - b.pricePaise,
  "price-desc": (a, b) => b.pricePaise - a.pricePaise,
  "year-desc": (a, b) => b.year - a.year,
  "km-asc": (a, b) => a.km - b.km,
};

export function findUsedCars<T extends UsedCarListing>(cars: T[], filters: UsedCarFilters, sort: UsedCarSort) {
  return cars.filter((car) => matchesFilters(car, filters)).toSorted(SORTERS[sort]);
}

export function activeFilterCount(filters: UsedCarFilters) {
  return (
    filters.modelSlugs.length +
    filters.fuels.length +
    Number(filters.yearFrom !== null) +
    Number(filters.yearTo !== null) +
    Number(filters.priceRangePaise !== null) +
    Number(filters.maxKm !== null)
  );
}

const PRICE_ROUNDING_PAISE = 10_000_00;
const KM_ROUNDING = 5_000;

// Slider bounds come from the stock itself, rounded outwards so every car fits inside.
export function filterOptionsFor(cars: UsedCarListing[]) {
  const prices = cars.map((car) => car.pricePaise);
  const models = new Map(cars.map((car) => [car.modelSlug, car.modelName]));
  return {
    models: [...models].map(([slug, name]) => ({ slug, name })).toSorted((a, b) => a.name.localeCompare(b.name)),
    fuels: [...new Set(cars.map((car) => car.fuel))],
    years: [...new Set(cars.map((car) => car.year))].toSorted((a, b) => b - a),
    priceBoundsPaise: [
      Math.floor(Math.min(...prices) / PRICE_ROUNDING_PAISE) * PRICE_ROUNDING_PAISE,
      Math.ceil(Math.max(...prices) / PRICE_ROUNDING_PAISE) * PRICE_ROUNDING_PAISE,
    ] as [number, number],
    maxKmBound: Math.ceil(Math.max(...cars.map((car) => car.km)) / KM_ROUNDING) * KM_ROUNDING,
  };
}
