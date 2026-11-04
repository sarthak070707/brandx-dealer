// Placeholder with the same shape as the car and used-car pages, shown while their data loads.
export function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
      <div className="aspect-[16/10] rounded-2xl bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-12 w-2/3 rounded bg-muted" />
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
