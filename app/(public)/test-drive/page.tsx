import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getBookingOptions, type BookingOptions } from "@/lib/booking/queries";

export const metadata: Metadata = {
  title: "Book a test drive | Brand X Lucknow",
  description: "Pick a showroom, a demo car and a free 30-minute slot. A named consultant confirms it with you.",
};

// Coming from a model page pre-selects the first showroom with that model's demo car (spec).
function preselect(options: BookingOptions, modelSlug: string | undefined) {
  for (const showroom of options) {
    const car = showroom.demoCars.find((demo) => demo.available && demo.variant.model.slug === modelSlug);
    if (car) return { showroomId: showroom.id, demoCarId: car.id };
  }
  return null;
}

async function Booking({ searchParams }: { searchParams: PageProps<"/test-drive">["searchParams"] }) {
  const [options, { model }] = await Promise.all([getBookingOptions(), searchParams]);
  return <BookingFlow options={options} preselected={preselect(options, typeof model === "string" ? model : undefined)} />;
}

export default function TestDrivePage({ searchParams }: PageProps<"/test-drive">) {
  return (
    <main className="px-4 py-12 sm:px-8 lg:px-12 lg:pb-section">
      <div className="mb-10 flex max-w-2xl flex-col gap-3">
        <h1 className="text-5xl font-light tracking-tight font-stretch-semi-condensed sm:text-6xl">Book a test drive</h1>
        <p className="text-lg text-muted-foreground">
          Pick a showroom, a demo car and a free 30-minute slot. A named consultant confirms it with you.
        </p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
        <Booking searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
