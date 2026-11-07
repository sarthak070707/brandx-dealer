import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Marquee } from "@/components/marquee";
import { TEST_DRIVE_HREF } from "@/components/site-links";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getModelLineup, type ModelSummary } from "@/lib/catalogue";
import { formatRupees } from "@/lib/money";

function CarTile({ model, photo, fromLabel }: { model: ModelSummary; photo: string; fromLabel: string | null }) {
  return (
    <figure className="relative h-40 w-60 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-48 sm:w-72">
      <Image src={photo} alt={model.name} fill sizes="288px" className="object-cover" />
      <figcaption className="absolute bottom-3 left-3 rounded-lg bg-card/90 px-2.5 py-1 text-sm text-card-foreground">
        {model.name}
        {fromLabel && <span className="text-muted-foreground"> {fromLabel}</span>}
      </figcaption>
    </figure>
  );
}

export async function Hero() {
  const [lineup, t, nav] = await Promise.all([getModelLineup(), getTranslations("Home"), getTranslations("Nav")]);
  const prices = lineup.flatMap((model) => (model.fromPaise === null ? [] : [model.fromPaise]));

  const tilesFor = (models: ModelSummary[]) =>
    models.flatMap((model) =>
      model.photos.map((photo) => (
        <CarTile
          key={photo}
          model={model}
          photo={photo}
          fromLabel={model.fromPaise === null ? null : t("tileFrom", { price: formatRupees(model.fromPaise) })}
        />
      )),
    );

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden border-b bg-card">
      <div className="grid items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:px-12 lg:py-24">
        <div className="flex max-w-xl flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <h1
            id="hero-title"
            className="text-5xl leading-[1.02] font-light tracking-tight font-stretch-semi-condensed sm:text-6xl xl:text-7xl"
          >
            {t("heroTitle")}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {prices.length > 0 ? t("heroLeadWithPrice", { price: formatRupees(Math.min(...prices)) }) : t("heroLead")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={TEST_DRIVE_HREF}>{nav("bookTestDrive")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/cars">{t("seePrices")}</Link>
            </Button>
          </div>
        </div>

        <div className="-mx-4 flex flex-col gap-4 mask-x-from-90% sm:-mx-8 lg:mx-0">
          <Marquee>{tilesFor(lineup.filter((model) => model.featured))}</Marquee>
          <div className="hidden sm:block">
            <Marquee reverse>{tilesFor(lineup.filter((model) => !model.featured))}</Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
