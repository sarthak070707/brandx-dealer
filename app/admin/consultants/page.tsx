import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountsTable } from "@/components/admin/accounts-table";
import { getAccounts } from "@/lib/admin/user-queries";
import { requireAdmin } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Consultants" };

async function LoadedAccounts() {
  await requireAdmin();
  return <AccountsTable {...(await getAccounts())} />;
}

export default function ConsultantsPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-light tracking-tight font-stretch-semi-condensed">Consultants</h1>
        <p className="max-w-prose text-muted-foreground">
          New leads go to the active consultant at the lead&apos;s showroom who handles that model and has the fewest open leads.
          Deactivating someone stops new leads and sign-in at once; their history stays.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <LoadedAccounts />
      </Suspense>
    </div>
  );
}
