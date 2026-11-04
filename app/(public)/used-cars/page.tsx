import type { Metadata } from "next";
import { UsedCarBrowser } from "@/components/used/used-car-browser";
import { filterOptionsFor } from "@/lib/used-cars/filter";
import { getUsedCars } from "@/lib/used-cars/queries";

export const metadata: Metadata = {
  title: "Certified used cars | Brand X Lucknow",
  description: "Inspected used Brand X cars with full inspection reports. Filter by model, year, fuel, km and price.",
};

export default async function UsedCarsPage() {
  const cars = await getUsedCars();

  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">Certified used</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Every car is inspected across six areas before it is listed, and the full report is on its page.
        </p>
      </div>
      {cars.length > 0 ? (
        <UsedCarBrowser cars={cars} options={filterOptionsFor(cars)} />
      ) : (
        <p className="rounded-2xl border bg-card p-8 text-lg">No certified used cars right now. New stock arrives every week.</p>
      )}
    </main>
  );
}
