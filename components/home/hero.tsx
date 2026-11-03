import Image from "next/image";
import Link from "next/link";
import { Marquee } from "@/components/marquee";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { getModelLineup, type ModelSummary } from "@/lib/catalogue";
import { formatRupees } from "@/lib/money";

function CarTile({ model, photo }: { model: ModelSummary; photo: string }) {
  return (
    <figure className="relative h-40 w-60 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-48 sm:w-72">
      <Image src={photo} alt={model.name} fill sizes="288px" className="object-cover" />
      <figcaption className="absolute bottom-3 left-3 rounded-lg bg-card/90 px-2.5 py-1 text-sm text-card-foreground">
        {model.name}
        {model.fromPaise !== null && <span className="text-muted-foreground"> from {formatRupees(model.fromPaise)}</span>}
      </figcaption>
    </figure>
  );
}

function tilesFor(lineup: ModelSummary[], photoIndex: number) {
  return lineup
    .filter((model) => model.photos[photoIndex])
    .map((model) => <CarTile key={model.slug} model={model} photo={model.photos[photoIndex]} />);
}

export async function Hero() {
  const lineup = await getModelLineup();
  const prices = lineup.flatMap((model) => (model.fromPaise === null ? [] : [model.fromPaise]));

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden border-b bg-card">
      <div className="grid items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:px-12 lg:py-24">
        <div className="flex max-w-xl flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <h1
            id="hero-title"
            className="text-5xl leading-[1.02] font-light tracking-tight font-stretch-semi-condensed sm:text-6xl xl:text-7xl"
          >
            Every Brand X, priced for your city.
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {prices.length > 0 && `New cars from ${formatRupees(Math.min(...prices))} ex-showroom, and inspected certified used cars. `}
            See the exact on-road price for your city before you visit.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={TEST_DRIVE_HREF}>Book a test drive</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#new-cars">See on-road prices</Link>
            </Button>
          </div>
        </div>

        <div className="-mx-4 flex flex-col gap-4 mask-x-from-90% sm:-mx-8 lg:mx-0">
          <Marquee>{tilesFor(lineup, 0)}</Marquee>
          <div className="hidden sm:block">
            <Marquee reverse>{tilesFor(lineup, 1)}</Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
