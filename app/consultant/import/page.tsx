import type { Metadata } from "next";
import { Suspense } from "react";
import { LeadImport } from "@/components/staff/lead-import";
import { getShowroomOptions } from "@/lib/admin/car-queries";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Import leads" };

async function LoadedImport() {
  const staff = await requireStaff();
  const isAdmin = staff.role === "ADMIN";
  return <LeadImport isAdmin={isAdmin} showrooms={isAdmin ? await getShowroomOptions() : []} />;
}

export default function ImportLeadsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display tracking-tight">Import leads</h1>
        <p className="max-w-prose text-muted-foreground">
          Bring in leads from a portal as a CSV file. You see what will happen to every row before anything is saved, and running the same file twice
          adds nothing new.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 max-w-4xl animate-pulse rounded-2xl bg-muted" />}>
        <LoadedImport />
      </Suspense>
    </div>
  );
}
