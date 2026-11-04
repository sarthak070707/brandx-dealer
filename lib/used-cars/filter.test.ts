import { describe, expect, it } from "vitest";
import { activeFilterCount, filterOptionsFor, findUsedCars, NO_FILTERS, type UsedCarListing } from "./filter";

const lakh = (amount: number) => amount * 1_00_000 * 100;

const CARS: UsedCarListing[] = [
  { stockId: "UC-1", modelSlug: "model-c", modelName: "Model C", variantName: "VX", fuel: "DIESEL", year: 2022, km: 41_200, pricePaise: lakh(8.45) },
  { stockId: "UC-2", modelSlug: "model-s", modelName: "Model S", variantName: "LX", fuel: "PETROL", year: 2021, km: 58_600, pricePaise: lakh(5.12) },
  { stockId: "UC-3", modelSlug: "model-h", modelName: "Model H", variantName: "ZX", fuel: "DIESEL", year: 2023, km: 22_800, pricePaise: lakh(12.1) },
];

const ids = (cars: UsedCarListing[]) => cars.map((car) => car.stockId);

describe("findUsedCars", () => {
  it("returns everything when no filter is set", () => {
    expect(ids(findUsedCars(CARS, NO_FILTERS, "price-asc"))).toEqual(["UC-2", "UC-1", "UC-3"]);
  });

  it("treats ticked models and fuels as 'any of'", () => {
    const diesel = findUsedCars(CARS, { ...NO_FILTERS, fuels: ["DIESEL"] }, "price-asc");
    expect(ids(diesel)).toEqual(["UC-1", "UC-3"]);
    const twoModels = findUsedCars(CARS, { ...NO_FILTERS, modelSlugs: ["model-s", "model-h"] }, "price-asc");
    expect(ids(twoModels)).toEqual(["UC-2", "UC-3"]);
  });

  it("combines different filters with 'and'", () => {
    const filters = { ...NO_FILTERS, fuels: ["DIESEL" as const], maxKm: 30_000 };
    expect(ids(findUsedCars(CARS, filters, "price-asc"))).toEqual(["UC-3"]);
  });

  it("includes both ends of year and price ranges", () => {
    const years = { ...NO_FILTERS, yearFrom: 2021, yearTo: 2022 };
    expect(ids(findUsedCars(CARS, years, "price-asc"))).toEqual(["UC-2", "UC-1"]);
    const prices = { ...NO_FILTERS, priceRangePaise: [lakh(5.12), lakh(8.45)] as [number, number] };
    expect(ids(findUsedCars(CARS, prices, "price-asc"))).toEqual(["UC-2", "UC-1"]);
  });

  it("sorts by the chosen order", () => {
    expect(ids(findUsedCars(CARS, NO_FILTERS, "year-desc"))).toEqual(["UC-3", "UC-1", "UC-2"]);
    expect(ids(findUsedCars(CARS, NO_FILTERS, "km-asc"))).toEqual(["UC-3", "UC-1", "UC-2"]);
    expect(ids(findUsedCars(CARS, NO_FILTERS, "price-desc"))).toEqual(["UC-3", "UC-1", "UC-2"]);
  });
});

describe("activeFilterCount", () => {
  it("counts each ticked option and each set range", () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...NO_FILTERS, fuels: ["PETROL", "CNG"], yearFrom: 2020, maxKm: 50_000 })).toBe(4);
  });
});

describe("filterOptionsFor", () => {
  it("builds options from the stock, rounding bounds outwards", () => {
    const options = filterOptionsFor(CARS);
    expect(options.models.map((model) => model.name)).toEqual(["Model C", "Model H", "Model S"]);
    expect(options.fuels).toEqual(["DIESEL", "PETROL"]);
    expect(options.years).toEqual([2023, 2022, 2021]);
    expect(options.priceBoundsPaise).toEqual([5_10_000_00, 12_10_000_00]);
    expect(options.maxKmBound).toBe(60_000);
  });
});
