import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Fuel, Transmission } from "@/generated/prisma/enums";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";

// Everything is text while it is being typed; the server turns it into numbers and paise.
export type VariantForm = {
  name: string;
  fuel: Fuel;
  transmission: Transmission;
  engine: string;
  powerBhp: string;
  mileageKmpl: string;
  seats: string;
  bootLitres: string;
  exShowroom: string;
  insurance: string;
};

export const blankVariant = (): VariantForm => ({
  name: "",
  fuel: "PETROL",
  transmission: "MANUAL",
  engine: "",
  powerBhp: "",
  mileageKmpl: "",
  seats: "5",
  bootLitres: "",
  exShowroom: "",
  insurance: "",
});

type Props = { value: VariantForm; onChange: (value: VariantForm) => void; errors: Record<string, string>; prefix: string };

export function VariantFields({ value, onChange, errors, prefix }: Props) {
  const error = (name: keyof VariantForm) => errors[`${prefix}.${name}`];

  const text = (name: keyof VariantForm, label: string, options: { placeholder?: string; numeric?: boolean } = {}) => (
    <Field label={label} error={error(name)}>
      <Input
        value={value[name]}
        placeholder={options.placeholder}
        inputMode={options.numeric ? "numeric" : undefined}
        aria-invalid={Boolean(error(name))}
        onChange={(event) => onChange({ ...value, [name]: event.target.value })}
      />
    </Field>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {text("name", "Variant name", { placeholder: "VX" })}
      <Field label="Fuel" error={error("fuel")}>
        <NativeSelect value={value.fuel} onChange={(event) => onChange({ ...value, fuel: event.target.value as Fuel })}>
          {Object.values(Fuel).map((fuel) => (
            <option key={fuel} value={fuel}>
              {FUEL_LABEL[fuel]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Transmission" error={error("transmission")}>
        <NativeSelect value={value.transmission} onChange={(event) => onChange({ ...value, transmission: event.target.value as Transmission })}>
          {Object.values(Transmission).map((transmission) => (
            <option key={transmission} value={transmission}>
              {TRANSMISSION_LABEL[transmission]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {text("engine", "Engine", { placeholder: "1.5 L petrol" })}
      {text("powerBhp", "Power (bhp)", { numeric: true })}
      {text("mileageKmpl", "Mileage (km/l)", { placeholder: "17.2" })}
      {text("seats", "Seats", { numeric: true })}
      {text("bootLitres", "Boot (litres)", { numeric: true })}
      {text("exShowroom", "Ex-showroom price (₹)", { placeholder: "12,45,000", numeric: true })}
      {text("insurance", "First-year insurance (₹)", { placeholder: "52,000", numeric: true })}
      <p className="text-sm text-muted-foreground sm:col-span-2">
        The insurance figure is used for every city to begin with. Set it city by city under Price tables if it differs.
      </p>
    </div>
  );
}
