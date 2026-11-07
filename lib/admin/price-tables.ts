export type ColumnKind = "money" | "percent" | "date" | "text";
export type Column = { name: string; header: string; kind: ColumnKind };
export type KeyField = { name: string; header: string };
export type PriceTableId = "ex-showroom" | "road-tax" | "insurance" | "accessories";

type PriceTableConfig = { title: string; description: string; keys: KeyField[]; columns: Column[] };

const VALIDITY_COLUMNS: Column[] = [
  { name: "validFrom", header: "Valid from", kind: "date" },
  { name: "validTo", header: "Valid to", kind: "date" },
];

// The four price tables the car page reads (A3 to A7). Used by the screen and by the server.
export const PRICE_TABLES: Record<PriceTableId, PriceTableConfig> = {
  "ex-showroom": {
    title: "Ex-showroom prices",
    description: "The price of each variant. The car page uses the row that is valid today.",
    keys: [{ name: "variantId", header: "Variant" }],
    columns: [{ name: "exShowroom", header: "Ex-showroom (₹)", kind: "money" }, ...VALIDITY_COLUMNS],
  },
  "road-tax": {
    title: "Road tax",
    description: "A percentage of the ex-showroom price, set per city, fuel and price range. A range includes its lower limit and stops just below its upper limit.",
    keys: [
      { name: "cityId", header: "City" },
      { name: "fuel", header: "Fuel" },
    ],
    columns: [
      { name: "slabMin", header: "From (₹)", kind: "money" },
      { name: "slabMax", header: "Up to, not including (₹)", kind: "money" },
      { name: "rate", header: "Rate (%)", kind: "percent" },
      ...VALIDITY_COLUMNS,
    ],
  },
  insurance: {
    title: "Insurance",
    description: "The first-year premium for each variant in each city. A city with no row shows no on-road price for that variant.",
    keys: [
      { name: "variantId", header: "Variant" },
      { name: "cityId", header: "City" },
    ],
    columns: [{ name: "premium", header: "Premium (₹)", kind: "money" }, ...VALIDITY_COLUMNS],
  },
  accessories: {
    title: "Accessories",
    description: "Packs buyers can add to the on-road price. A model can have several, and buyers tick the ones they want. Two rows with the same pack name can't cover the same days.",
    keys: [{ name: "modelId", header: "Model" }],
    columns: [
      { name: "name", header: "Package name", kind: "text" },
      { name: "price", header: "Price (₹)", kind: "money" },
      { name: "items", header: "Items, separated by commas", kind: "text" },
      ...VALIDITY_COLUMNS,
    ],
  },
};

export const PRICE_TABLE_IDS = Object.keys(PRICE_TABLES) as PriceTableId[];

export const isPriceTableId = (value: string): value is PriceTableId => Object.hasOwn(PRICE_TABLES, value);
