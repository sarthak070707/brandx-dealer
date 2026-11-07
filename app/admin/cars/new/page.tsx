import type { Metadata } from "next";
import { Suspense } from "react";
import { NewCarForm } from "@/components/admin/new-car-form";
import { getShowroomOptions } from "@/lib/admin/car-queries";
import { requireAdmin } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Add a car" };

async function LoadedForm() {
  await requireAdmin();
  return <NewCarForm showrooms={await getShowroomOptions()} />;
}

export default function NewCarPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight font-stretch-semi-condensed">Add a car</h1>
        <p className="max-w-prose text-muted-foreground">
          Fill in the car, its colours with a photo each, and at least one variant with its price. It goes live on the website as soon as you add it.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 max-w-3xl animate-pulse rounded-2xl bg-muted" />}>
        <LoadedForm />
      </Suspense>
    </div>
  );
}
