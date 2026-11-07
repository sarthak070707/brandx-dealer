import { useTranslations } from "next-intl";
import type { CarVariant } from "@/lib/catalogue";
import { formatRupees } from "@/lib/money";

type Props = { variants: CarVariant[]; selectedId: string; onSelect: (id: string) => void };

export function VariantPicker({ variants, selectedId, onSelect }: Props) {
  const t = useTranslations("Variant");
  const labels = useTranslations("Labels");

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm text-muted-foreground">{t("legend")}</legend>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {variants.map((variant) => (
          <label key={variant.id} className="cursor-pointer">
            <input
              type="radio"
              name="variant"
              value={variant.id}
              checked={variant.id === selectedId}
              onChange={() => onSelect(variant.id)}
              className="peer sr-only"
            />
            <span className="flex h-full flex-col gap-1 rounded-xl border bg-card p-4 transition-colors peer-checked:border-foreground peer-checked:ring-1 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:border-foreground/40">
              <span className="text-lg">{variant.name}</span>
              <span className="text-sm text-muted-foreground">
                {labels(`transmission.${variant.transmission}`)}, {labels(`fuel.${variant.fuel}`)}
              </span>
              <span className="mt-2 text-sm">
                {variant.exShowroomPaise === null ? t("onRequest") : t("exShowroom", { price: formatRupees(variant.exShowroomPaise) })}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
