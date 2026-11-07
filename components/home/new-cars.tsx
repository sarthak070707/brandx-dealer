import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { cardStyle, ModelCard } from "@/components/model-card";
import { Link } from "@/i18n/navigation";
import { getAvailableUsedCarCount, getModelLineup } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

function UsedCarsCard({ count }: { count: number }) {
  const t = useTranslations("Home");

  return (
    <Link href="/used-cars" className={cn(cardStyle, "relative min-h-96 justify-end border-transparent text-white")}>
      <Image
        src="/cars/model-s-red.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      {/* Darkens the lower part so the white text stays readable over any photo, in both themes. */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-transparent" />
      <div className="relative flex flex-col gap-1 p-6">
        <p className="text-sm text-white/75">{t("usedLabel")}</p>
        <h3 className="text-2xl">{t("usedHeadline", { count })}</h3>
        <p className="text-white/75">{t("usedBody")}</p>
        <span className="mt-4 font-medium underline-offset-4 group-hover:underline">{t("usedCta")}</span>
      </div>
    </Link>
  );
}

export async function NewCars() {
  const [lineup, usedCarCount, t] = await Promise.all([getModelLineup(), getAvailableUsedCarCount(), getTranslations("Home")]);
  const featured = lineup.filter((model) => model.featured);

  return (
    <section
      id="new-cars"
      aria-labelledby="new-cars-title"
      className="scroll-mt-20 px-4 py-20 sm:px-8 lg:px-12 lg:py-section"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 id="new-cars-title" className="text-4xl font-display tracking-tight sm:text-5xl">
          {t("newCarsTitle")}
        </h2>
        <Link href="/cars" className="underline-offset-4 hover:underline">
          {t("seeAllModels", { count: lineup.length })}
        </Link>
      </div>
      <ul className="grid gap-4 lg:grid-cols-6">
        {featured.map((model, index) => (
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
