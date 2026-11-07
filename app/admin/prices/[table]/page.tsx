import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PriceTable } from "@/components/admin/price-table";
import { SegmentedNav } from "@/components/ui/segmented-nav";
import { getPriceTable } from "@/lib/admin/price-queries";
import { isPriceTableId, PRICE_TABLE_IDS, PRICE_TABLES } from "@/lib/admin/price-tables";
import { requireAdmin } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Price tables" };

const TABS = PRICE_TABLE_IDS.map((id) => ({ href: `/admin/prices/${id}`, label: PRICE_TABLES[id].title }));

async function LoadedTable({ params }: { params: PageProps<"/admin/prices/[table]">["params"] }) {
  await requireAdmin();
  const { table } = await params;
  if (!isPriceTableId(table)) notFound();
  const { rows, keyOptions } = await getPriceTable(table);

  return (
    <>
      <p className="max-w-prose text-muted-foreground">{PRICE_TABLES[table].description}</p>
      <PriceTable table={table} rows={rows} keyOptions={keyOptions} />
    </>
  );
}

export default function PriceTablesPage({ params }: PageProps<"/admin/prices/[table]">) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display tracking-tight">Price tables</h1>
        <p className="max-w-prose text-muted-foreground">
          These tables feed every on-road price. Saving a change updates the car pages straight away, with no code change.
        </p>
      </div>
      <SegmentedNav label="Price tables" items={TABS} />
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LoadedTable params={params} />
      </Suspense>
    </div>
  );
}
