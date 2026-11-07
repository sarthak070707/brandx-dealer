import { useTranslations } from "next-intl";
import type { CarVariant } from "@/lib/catalogue";
import { localised } from "@/lib/i18n/content";

// Which spec keys to show, in order, and which message turns the number into a phrase.
const SPEC_ROWS = [
  { key: "engine", label: "engine" },
  { key: "powerBhp", label: "power", value: "powerValue" },
  { key: "mileageKmpl", label: "mileage", value: "mileageValue" },
  { key: "seats", label: "seats" },
  { key: "bootLitres", label: "boot", value: "bootValue" },
] as const;

export function SpecList({ variant }: { variant: CarVariant }) {
  const t = useTranslations("Specs");
  const labels = useTranslations("Labels");
  const content = useTranslations("Content");

  const rows = [
    { label: t("fuel"), value: labels(`fuel.${variant.fuel}`) },
    { label: t("transmission"), value: labels(`transmission.${variant.transmission}`) },
    ...SPEC_ROWS.filter((row) => row.key in variant.specs).map((row) => {
      const raw = String(variant.specs[row.key]);
      const value = "value" in row ? t(row.value, { value: raw }) : row.key === "engine" ? localised(content, "engines", raw, raw) : raw;
      return { label: t(row.label), value };
    }),
  ];

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className="mb-4 text-sm text-muted-foreground">
        {t("title", { variant: variant.name })}
      </h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 bg-card p-4">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-lg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
