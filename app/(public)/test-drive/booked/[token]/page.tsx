import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cancelTestDrive } from "@/app/(public)/test-drive/actions";
import { Button } from "@/components/ui/button";
import { getBookingByToken } from "@/lib/booking/queries";
import { formatSlot } from "@/lib/dates";

export const metadata: Metadata = { title: "Your test drive | Brand X Lucknow", robots: { index: false } };

async function Confirmation({ params }: { params: PageProps<"/test-drive/booked/[token]">["params"] }) {
  const booking = await getBookingByToken((await params).token);
  if (!booking) notFound();

  const cancelled = booking.status === "CANCELLED";
  const upcoming = !cancelled && booking.slotStart > new Date();
  const consultant = booking.lead.assignedTo?.name;
  const { showroom, variant } = booking.demoCar;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">
          {cancelled ? "Test drive cancelled" : "Test drive booked"}
        </h1>
        <p className="text-lg text-muted-foreground">
          {cancelled
            ? "The slot is free again. You can book another time whenever suits you."
            : `${consultant ?? `Our team at ${showroom.name}`} will call you to confirm.${booking.lead.optedOutAt ? "" : " We've also sent the details on WhatsApp (simulated)."}`}
        </p>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        {[
          { label: "When", value: formatSlot(booking.slotStart) },
          { label: "Car", value: `${variant.model.name} ${variant.name}` },
          { label: "Showroom", value: `${showroom.name}, ${showroom.address}` },
          { label: "Your consultant", value: consultant ?? "Being assigned by the showroom" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 bg-card p-4">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-lg">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        {upcoming && (
          <form action={cancelTestDrive}>
            <input type="hidden" name="cancelToken" value={booking.cancelToken} />
            <Button type="submit" variant="outline">
              Cancel this test drive
            </Button>
          </form>
        )}
        <Button asChild variant="ghost">
          <Link href={cancelled ? "/test-drive" : "/cars"}>{cancelled ? "Book another time" : "Keep browsing cars"}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function BookedPage({ params }: PageProps<"/test-drive/booked/[token]">) {
  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <Suspense fallback={<div className="h-80 max-w-2xl animate-pulse rounded-2xl bg-muted" />}>
        <Confirmation params={params} />
      </Suspense>
    </main>
  );
}
