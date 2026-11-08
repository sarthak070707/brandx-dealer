import { useTranslations } from "next-intl";
import Image from "next/image";
import { cardStyle } from "@/components/model-card";
import { Link } from "@/i18n/navigation";
import { formatRupees } from "@/lib/money";
import type { UsedCarCard as UsedCar } from "@/lib/used-cars/queries";

const kmFormat = new Intl.NumberFormat("en-IN");

export function UsedCarCard({ car, eager = false, heading: Heading = "h3" }: { car: UsedCar; eager?: boolean; heading?: "h2" | "h3" }) {
  const t = useTranslations("UsedCard");
  const labels = useTranslations("Labels");

  return (
    <Link href={`/used-cars/${car.stockId}`} className={cardStyle}>
      <div className="relative h-48 shrink-0 overflow-hidden bg-muted">
        {car.photo && (
          <Image
            src={car.photo}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
        {car.status === "BOOKED" && (
          <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-sm text-card-foreground">{t("booked")}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{car.stockId}</p>
        <Heading className="text-xl">
          {car.modelName} {car.variantName}
        </Heading>
        <p className="text-sm text-muted-foreground">
          {t("details", {
            year: car.year,
            fuel: labels(`fuel.${car.fuel}`),
            transmission: labels(`transmission.${car.transmission}`),
            km: kmFormat.format(car.km),
            owners: t("owners", { count: car.owners }),
          })}
        </p>
        <p className="mt-auto pt-3 text-lg tabular-nums">{formatRupees(car.pricePaise)}</p>
      </div>
    </Link>
  );
}
