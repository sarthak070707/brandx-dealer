import { describe, expect, it } from "vitest";
import { carJsonLd, serializeJsonLd, usedCarJsonLd } from "./seo";

const ORIGIN = "https://brandx.example";

describe("carJsonLd", () => {
  const car = { name: "Model H", description: "A mid-size SUV", photos: ["/cars/model-h-1.webp"], lowestPaise: 10_95_000_00, variantCount: 3 };

  it("describes the model with full photo addresses and the lowest price in rupees", () => {
    expect(carJsonLd(car, ORIGIN)).toMatchObject({
      "@type": "Car",
      name: "Brand X Model H",
      image: ["https://brandx.example/cars/model-h-1.webp"],
      offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: 1_095_000, offerCount: 3 },
    });
  });

  it("makes no price claim when the model has no current price", () => {
    expect(carJsonLd({ ...car, lowestPaise: null }, ORIGIN)).not.toHaveProperty("offers");
  });
});

describe("usedCarJsonLd", () => {
  const used = { name: "Model C VX", year: 2022, km: 41_200, fuel: "Diesel", pricePaise: 8_45_000_00, status: "AVAILABLE" as const, photo: "/cars/model-c-teal.webp" };

  it("describes the used car as used, with its distance and price", () => {
    expect(usedCarJsonLd(used, ORIGIN)).toMatchObject({
      itemCondition: "https://schema.org/UsedCondition",
      vehicleModelDate: "2022",
      mileageFromOdometer: { value: 41_200, unitCode: "KMT" },
      offers: { price: 845_000, priceCurrency: "INR", availability: "https://schema.org/InStock" },
    });
  });

  it("reports booked and sold cars as such", () => {
    expect(usedCarJsonLd({ ...used, status: "BOOKED" }, ORIGIN).offers.availability).toBe("https://schema.org/LimitedAvailability");
    expect(usedCarJsonLd({ ...used, status: "SOLD" }, ORIGIN).offers.availability).toBe("https://schema.org/SoldOut");
  });

  it("has no field that could hold a registration number", () => {
    expect(JSON.stringify(usedCarJsonLd(used, ORIGIN)).toLowerCase()).not.toMatch(/reg|plate/);
  });
});

describe("serializeJsonLd", () => {
  it("cannot be used to close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
