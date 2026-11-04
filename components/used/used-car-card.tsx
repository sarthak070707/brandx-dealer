import Image from "next/image";
import Link from "next/link";
import { cardStyle } from "@/components/model-card";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import type { UsedCarCard as UsedCar } from "@/lib/used-cars/queries";

const kmFormat = new Intl.NumberFormat("en-IN");

export function ownersLabel(owners: number) {
  return owners === 1 ? "1st owner" : owners === 2 ? "2nd owner" : `${owners} owners`;
}

export function UsedCarCard({ car }: { car: UsedCar }) {
  return (
    <Link href={`/used-cars/${car.stockId}`} className={cardStyle}>
      <div className="relative h-48 shrink-0 overflow-hidden bg-muted">
        {car.photo && (
          <Image
            src={car.photo}
            alt=""
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
        {car.status === "BOOKED" && (
          <span className="absolute top-3 left-3 rounded-full bg-card/90 px-2.5 py-1 text-sm text-card-foreground">
            Booked
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{car.stockId}</p>
        <h3 className="text-xl">
          {car.modelName} {car.variantName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {car.year}, {FUEL_LABEL[car.fuel]}, {TRANSMISSION_LABEL[car.transmission]}, {kmFormat.format(car.km)} km,{" "}
          {ownersLabel(car.owners)}
        </p>
        <p className="mt-auto pt-3 text-lg tabular-nums">{formatRupees(car.pricePaise)}</p>
      </div>
    </Link>
  );
}
