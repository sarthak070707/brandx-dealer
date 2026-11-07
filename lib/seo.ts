import { routing } from "@/i18n/routing";

// Structured data for search engines (schema.org). Built from public facts only: it never takes
// a registration number or any buyer detail.
type CarInput = { name: string; description: string; photos: string[]; lowestPaise: number | null; variantCount: number };
type UsedCarInput = { name: string; year: number; km: number; fuel: string; pricePaise: number; status: "AVAILABLE" | "BOOKED" | "SOLD"; photo: string | null };

const BRAND = { "@type": "Brand", name: "Brand X" };
const CONTEXT = "https://schema.org";
const rupees = (paise: number) => paise / 100;
const absolute = (path: string, origin: string) => new URL(path, origin).toString();

const AVAILABILITY = {
  AVAILABLE: "https://schema.org/InStock",
  BOOKED: "https://schema.org/LimitedAvailability",
  SOLD: "https://schema.org/SoldOut",
} as const;

export function carJsonLd(car: CarInput, origin: string) {
  return {
    "@context": CONTEXT,
    "@type": "Car",
    name: `Brand X ${car.name}`,
    description: car.description,
    image: car.photos.map((photo) => absolute(photo, origin)),
    brand: BRAND,
    ...(car.lowestPaise !== null && {
      offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: rupees(car.lowestPaise), offerCount: car.variantCount },
    }),
  };
}

export function usedCarJsonLd(car: UsedCarInput, origin: string) {
  return {
    "@context": CONTEXT,
    "@type": "Car",
    name: `Brand X ${car.name}`,
    vehicleModelDate: String(car.year),
    fuelType: car.fuel,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: car.km, unitCode: "KMT" },
    itemCondition: "https://schema.org/UsedCondition",
    brand: BRAND,
    ...(car.photo && { image: absolute(car.photo, origin) }),
    offers: { "@type": "Offer", priceCurrency: "INR", price: rupees(car.pricePaise), availability: AVAILABILITY[car.status] },
  };
}

// Tells search engines that /en/x and /hi/x are the same page in two languages (hreflang).
export function alternatesFor(path: string, locale: string) {
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `/${locale}${suffix}`,
    languages: {
      ...Object.fromEntries(routing.locales.map((language) => [language, `/${language}${suffix}`])),
      "x-default": `/${routing.defaultLocale}${suffix}`,
    },
  };
}

// Put inside a <script> tag, so "<" is escaped and nothing in the data can close the tag early.
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
