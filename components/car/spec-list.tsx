import type { CarVariant } from "@/lib/catalogue";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";

const SPEC_ROWS = [
  { key: "engine", label: "Engine", unit: "" },
  { key: "powerBhp", label: "Power", unit: " bhp" },
  { key: "mileageKmpl", label: "Mileage", unit: " km/l" },
  { key: "seats", label: "Seats", unit: "" },
  { key: "bootLitres", label: "Boot", unit: " litres" },
];

export function SpecList({ variant }: { variant: CarVariant }) {
  const rows = [
    { label: "Fuel", value: FUEL_LABEL[variant.fuel] },
    { label: "Transmission", value: TRANSMISSION_LABEL[variant.transmission] },
    ...SPEC_ROWS.filter((row) => row.key in variant.specs).map((row) => ({
      label: row.label,
      value: `${variant.specs[row.key]}${row.unit}`,
    })),
  ];

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className="mb-4 text-sm text-muted-foreground">
        Key specs, {variant.name}
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
