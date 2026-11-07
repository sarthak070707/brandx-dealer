import Link from "next/link";
import { Suspense } from "react";
import { Inbox } from "@/components/staff/inbox";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/staff";
import { getInbox } from "@/lib/leads/queries";

async function LoadedInbox() {
  const staff = await requireStaff();
  const { leads, showrooms, consultants, renderedAt } = await getInbox(staff);

  return (
    <>
      <p className="text-muted-foreground">
        {staff.role === "ADMIN" ? "Every lead across all showrooms." : "The leads assigned to you."} Longest-waiting first.
      </p>
      <Inbox leads={leads} showrooms={showrooms} consultants={consultants} renderedAt={renderedAt} />
    </>
  );
}

function InboxSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-4">
      <div className="h-5 w-64 rounded bg-muted" />
      <div className="h-9 w-80 rounded bg-muted" />
      <div className="h-96 rounded-2xl bg-muted" />
    </div>
  );
}

export default function InboxPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-display tracking-tight">Lead inbox</h1>
        <Button asChild variant="outline">
          <Link href="/consultant/import">Import leads</Link>
        </Button>
      </div>
      <Suspense fallback={<InboxSkeleton />}>
        <LoadedInbox />
      </Suspense>
    </div>
  );
}
