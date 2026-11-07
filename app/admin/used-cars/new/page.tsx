import type { Metadata } from "next";
import { Suspense } from "react";
import { UsedCarForm } from "@/components/admin/used-car-form";
import { getUsedCarOptions } from "@/lib/admin/used-car-queries";
import { requireAdmin } from "@/lib/auth/staff";
import { dateToInputText } from "@/lib/admin/parse";
import { indiaToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Add a used car" };

async function LoadedForm() {
  await requireAdmin();
  return <UsedCarForm options={await getUsedCarOptions()} today={dateToInputText(indiaToday(new Date()))} />;
}

export default function NewUsedCarPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display tracking-tight">Add a used car</h1>
        <p className="max-w-prose text-muted-foreground">It gets the next stock number and appears on the website as soon as you add it.</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 max-w-3xl animate-pulse rounded-2xl bg-muted" />}>
        <LoadedForm />
      </Suspense>
    </div>
  );
}
