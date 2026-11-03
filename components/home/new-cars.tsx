import Image from "next/image";
import Link from "next/link";
import type { BodyType } from "@/generated/prisma/enums";
import { getAvailableUsedCarCount, getCityNames, getModelLineup, type ModelSummary } from "@/lib/catalogue";
import { formatRupees } from "@/lib/money";
import { cn } from "@/lib/utils";

const BODY_TYPE_LABEL: Record<BodyType, string> = {
  HATCHBACK: "Hatchback",
  SEDAN: "Sedan",
  SUV: "SUV",
  MPV: "MPV",
};

const cardStyle =
  "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function ModelCard({ model, large }: { model: ModelSummary; large: boolean }) {
  return (
    <Link href={`/cars/${model.slug}`} className={cardStyle}>
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", large ? "h-64 sm:h-80" : "h-56")}>
        {model.photos[0] && (
          <Image
            src={model.photos[0]}
            alt=""
            fill
            sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-6">
        <p className="text-sm text-muted-foreground">{BODY_TYPE_LABEL[model.bodyType]}</p>
        <h3 className="text-2xl">{model.name}</h3>
        <p className="text-muted-foreground">{model.description}</p>
        {model.fromPaise !== null && (
          <p className="mt-auto pt-4">
            from {formatRupees(model.fromPaise)} <span className="text-muted-foreground">ex-showroom</span>
          </p>
        )}
      </div>
    </Link>
  );
}

function UsedCarsCard({ count }: { count: number }) {
  return (
    <Link href="/used-cars" className={cn(cardStyle, "relative min-h-96 justify-end border-transparent text-white")}>
      <Image
        src="/cars/certified-used.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      {/* Darkens the lower part so the white text stays readable over any photo, in both themes. */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-transparent" />
      <div className="relative flex flex-col gap-1 p-6">
        <p className="text-sm text-white/75">Certified used</p>
        <h3 className="text-2xl">
          {count} inspected {count === 1 ? "car" : "cars"} available
        </h3>
        <p className="text-white/75">
          Every car comes with its full inspection report. Filter by model, year, fuel, km and price.
        </p>
        <span className="mt-4 font-medium underline-offset-4 group-hover:underline">Browse certified used</span>
      </div>
    </Link>
  );
}

export async function NewCars() {
  const [lineup, usedCarCount, cities] = await Promise.all([
    getModelLineup(),
    getAvailableUsedCarCount(),
    getCityNames(),
  ]);

  return (
    <section
      id="new-cars"
      aria-labelledby="new-cars-title"
      className="scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-section"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="new-cars-title" className="text-4xl font-light tracking-tight font-stretch-semi-condensed sm:text-5xl">
          New cars
        </h2>
        <p className="text-muted-foreground">On-road prices for {new Intl.ListFormat("en-IN").format(cities)}</p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-6">
        {lineup.map((model, index) => (
          <li key={model.slug} className={index < 2 ? "lg:col-span-3" : "lg:col-span-2"}>
            <ModelCard model={model} large={index < 2} />
          </li>
        ))}
        <li className="lg:col-span-2">
          <UsedCarsCard count={usedCarCount} />
        </li>
      </ul>
    </section>
  );
}
