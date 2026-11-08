import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { ModelSummary } from "@/lib/catalogue";
import { localised } from "@/lib/i18n/content";
import { formatRupees } from "@/lib/money";
import { cn } from "@/lib/utils";

// The cards on screen when a list first opens (a phone shows one, a laptop a row): their photos load first.
export const EAGER_CARDS = 3;

export const cardStyle =
  "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// heading is the level of the car's name: h3 under a section heading on the home page, h2 straight under a page title.
export function ModelCard({ model, large = false, eager = false, heading: Heading = "h3" }: { model: ModelSummary; large?: boolean; eager?: boolean; heading?: "h2" | "h3" }) {
  const t = useTranslations("ModelCard");
  const labels = useTranslations("Labels");
  const content = useTranslations("Content");

  return (
    <Link href={`/cars/${model.slug}`} className={cardStyle}>
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", large ? "h-64 sm:h-80" : "h-56")}>
        {model.photos[0] && (
          <Image
            src={model.photos[0]}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-6">
        <p className="text-sm text-muted-foreground">{labels(`bodyType.${model.bodyType}`)}</p>
        <Heading className="text-2xl">{model.name}</Heading>
        <p className="text-muted-foreground">{localised(content, "models", model.slug, model.description)}</p>
        {model.fromPaise !== null && (
          <p className="mt-auto pt-4">
            {t.rich("fromPrice", {
              price: formatRupees(model.fromPaise),
              muted: (chunks) => <span className="text-muted-foreground">{chunks}</span>,
            })}
          </p>
        )}
      </div>
    </Link>
  );
}
