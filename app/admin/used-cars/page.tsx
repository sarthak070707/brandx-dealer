import type { Metadata } from "next";
import { Suspense } from "react";
import { UsedCarsTable } from "@/components/admin/used-cars-table";
import { getAdminUsedCars } from "@/lib/admin/used-car-queries";
import { requireAdmin } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Used stock" };

async function LoadedCars() {
  await requireAdmin();
  return <UsedCarsTable cars={await getAdminUsedCars()} />;
}

export default function UsedStockPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display tracking-tight">Used stock</h1>
        <p className="max-w-prose text-muted-foreground">
          The certified used cars on the website. Change a car&apos;s status here as it books and sells. Sold cars leave the public list straight away.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LoadedCars />
      </Suspense>
    </div>
  );
}
