import Image from "next/image";
import Link from "next/link";
import type { ModelSummary } from "@/lib/catalogue";
import { BODY_TYPE_LABEL } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import { cn } from "@/lib/utils";

export const cardStyle =
  "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ModelCard({ model, large = false }: { model: ModelSummary; large?: boolean }) {
  return (
    <Link href={`/cars/${model.slug}`} className={cardStyle}>
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", large ? "h-64 sm:h-80" : "h-56")}>
        {model.photos[0] && (
          <Image
            src={model.photos[0]}
            alt=""
            fill
            sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"}
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
