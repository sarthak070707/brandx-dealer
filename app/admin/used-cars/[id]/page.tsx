import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UsedCarForm } from "@/components/admin/used-car-form";
import { getUsedCarForEdit, getUsedCarOptions } from "@/lib/admin/used-car-queries";
import { requireAdmin } from "@/lib/auth/staff";
import { dateToInputText } from "@/lib/admin/parse";
import { indiaToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Edit a used car" };

async function LoadedForm({ params }: { params: PageProps<"/admin/used-cars/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const [car, options] = await Promise.all([getUsedCarForEdit(id), getUsedCarOptions()]);
  if (!car) notFound();
  return <UsedCarForm options={options} initial={car} today={dateToInputText(indiaToday(new Date()))} />;
}

export default function EditUsedCarPage({ params }: PageProps<"/admin/used-cars/[id]">) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-display tracking-tight">Edit a used car</h1>
      <Suspense fallback={<div aria-hidden="true" className="h-96 max-w-3xl animate-pulse rounded-2xl bg-muted" />}>
        <LoadedForm params={params} />
      </Suspense>
    </div>
  );
}
