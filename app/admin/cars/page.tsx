import type { Metadata } from "next";
import { Suspense } from "react";
import { CarsTable } from "@/components/admin/cars-table";
import { getAdminCars } from "@/lib/admin/car-queries";
import { requireAdmin } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Cars" };

async function LoadedCars() {
  await requireAdmin();
  return <CarsTable cars={await getAdminCars()} />;
}

export default function CarsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight font-stretch-semi-condensed">Cars</h1>
        <p className="max-w-prose text-muted-foreground">
          The new cars on the website. A car you add appears on the site within seconds, with its prices. Prices and accessories can be changed later
          under Price tables.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LoadedCars />
      </Suspense>
    </div>
  );
}
