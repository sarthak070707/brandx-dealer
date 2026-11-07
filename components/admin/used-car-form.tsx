"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveUsedCarAction } from "@/app/admin/used-cars/actions";
import { PhotoUpload } from "@/components/admin/photo-upload";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Fuel, Transmission, UsedCarStatus } from "@/generated/prisma/enums";
import { INSPECTION_AREAS, type InspectionResult } from "@/lib/admin/used-car-report";
import type { UsedCarFormValues, UsedCarOptions } from "@/lib/admin/used-car-queries";
import { FUEL_LABEL, TRANSMISSION_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Props = { options: UsedCarOptions; today: string; initial?: UsedCarFormValues };
type FormState = Omit<UsedCarFormValues, "id" | "stockId" | "modelName">;

const STATUS_LABEL: Record<UsedCarStatus, string> = { AVAILABLE: "Available", BOOKED: "Booked", SOLD: "Sold" };
const sectionStyle = "flex flex-col gap-5 rounded-2xl border bg-card p-6";

export function UsedCarForm({ options, today, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => ({
    modelId: initial?.modelId ?? "",
    showroomId: initial?.showroomId ?? "",
    variantName: initial?.variantName ?? "",
    fuel: initial?.fuel ?? "PETROL",
    transmission: initial?.transmission ?? "MANUAL",
    year: initial?.year ?? "",
    km: initial?.km ?? "",
    owners: initial?.owners ?? "1",
    regNumber: initial?.regNumber ?? "",
    price: initial?.price ?? "",
    status: initial?.status ?? "AVAILABLE",
    inspectedOn: initial?.inspectedOn ?? today,
    score: initial?.score ?? "",
    results: initial?.results ?? INSPECTION_AREAS.map((): InspectionResult => "PASS"),
    photo: initial?.photo ?? "",
  }));
  const [problems, setProblems] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [pending, startTransition] = useTransition();

  const error = (field: string) => problems.fields[field];
  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }));
  const modelPhotos = options.models.find((model) => model.id === form.modelId)?.photos ?? [];

  // Picking a car offers its own photos; the first is used until the admin chooses another.
  const chooseModel = (modelId: string) => {
    const photos = options.models.find((model) => model.id === modelId)?.photos ?? [];
    setForm((current) => ({ ...current, modelId, photo: photos.includes(current.photo) || current.photo.startsWith("/api/") ? current.photo : (photos[0] ?? "") }));
  };

  const text = (field: keyof FormState, label: string, extra: { placeholder?: string; numeric?: boolean } = {}) => (
    <Field label={label} error={error(field)}>
      <Input
        value={String(form[field])}
        placeholder={extra.placeholder}
        inputMode={extra.numeric ? "numeric" : undefined}
        aria-invalid={Boolean(error(field))}
        onChange={(event) => set(field, event.target.value as never)}
      />
    </Field>
  );

  const submit = () =>
    startTransition(async () => {
      const result = await saveUsedCarAction({ id: initial?.id ?? null, ...form });
      if (!result.ok) return setProblems({ message: result.error, fields: result.fieldErrors ?? {} });
      toast.success(initial ? `${result.stockId} saved` : `${result.stockId} added`);
      router.push("/admin/used-cars");
    });

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section className={sectionStyle} aria-labelledby="used-car">
        <h2 id="used-car" className="text-xl">
          {initial ? initial.stockId : "The car"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Car" error={error("modelId")}>
            <NativeSelect value={form.modelId} disabled={Boolean(initial)} onChange={(event) => chooseModel(event.target.value)}>
              <option value="">Choose a car</option>
              {options.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {text("variantName", "Variant", { placeholder: "VX" })}
          <Field label="Fuel" error={error("fuel")}>
            <NativeSelect value={form.fuel} onChange={(event) => set("fuel", event.target.value as Fuel)}>
              {Object.values(Fuel).map((fuel) => (
                <option key={fuel} value={fuel}>
                  {FUEL_LABEL[fuel]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Transmission" error={error("transmission")}>
            <NativeSelect value={form.transmission} onChange={(event) => set("transmission", event.target.value as Transmission)}>
              {Object.values(Transmission).map((transmission) => (
                <option key={transmission} value={transmission}>
                  {TRANSMISSION_LABEL[transmission]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {text("year", "Year", { placeholder: "2022", numeric: true })}
          {text("km", "Driven (km)", { placeholder: "41200", numeric: true })}
          {text("owners", "Owners so far", { numeric: true })}
          <Field label="Showroom" error={error("showroomId")}>
            <NativeSelect value={form.showroomId} onChange={(event) => set("showroomId", event.target.value)}>
              <option value="">Choose a showroom</option>
              {options.showrooms.map((showroom) => (
                <option key={showroom.value} value={showroom.value}>
                  {showroom.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </section>

      <section className={sectionStyle} aria-labelledby="used-price">
        <h2 id="used-price" className="text-xl">
          Registration, price and status
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {text("regNumber", "Registration number", { placeholder: "UP32MN2741" })}
          {text("price", "Listed price (₹)", { placeholder: "8,45,000", numeric: true })}
          <Field label="Status" error={error("status")}>
            <NativeSelect value={form.status} onChange={(event) => set("status", event.target.value as UsedCarStatus)}>
              {Object.values(UsedCarStatus).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <p className="text-sm text-muted-foreground">Buyers only see the state and RTO of the registration number, never the whole of it.</p>
      </section>

      <section className={sectionStyle} aria-labelledby="used-inspection">
        <h2 id="used-inspection" className="text-xl">
          Inspection
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Inspected on" error={error("inspectedOn")}>
            <Input type="date" value={form.inspectedOn} aria-invalid={Boolean(error("inspectedOn"))} onChange={(event) => set("inspectedOn", event.target.value)} />
          </Field>
          {text("score", "Overall score (0 to 100)", { numeric: true })}
        </div>
        {error("results") && <p className="text-sm text-destructive">{error("results")}</p>}
        <ul className="divide-y border-y">
          {INSPECTION_AREAS.map((area, index) => (
            <li key={area} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>{area}</span>
              <div role="radiogroup" aria-label={area} className="flex gap-4">
                {(["PASS", "ATTENTION"] as const).map((result) => (
                  <label key={result} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`inspection-${index}`}
                      className="size-4 accent-foreground"
                      checked={form.results[index] === result}
                      onChange={() => set("results", form.results.map((current, position) => (position === index ? result : current)))}
                    />
                    {result === "PASS" ? "Passed" : "Needs attention"}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionStyle} aria-labelledby="used-photo">
        <div>
          <h2 id="used-photo" className="text-xl">
            Photo
          </h2>
          <p className="text-sm text-muted-foreground">Use one of this car model&apos;s photos, or upload one of the actual car.</p>
        </div>
        {error("photo") && <p className="text-sm text-destructive">{error("photo")}</p>}
        {modelPhotos.length > 0 && (
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Photos of this model">
            {modelPhotos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                role="radio"
                aria-checked={form.photo === photo}
                aria-label={`Model photo ${index + 1}`}
                onClick={() => set("photo", photo)}
                className={cn("relative h-20 w-32 overflow-hidden rounded-lg border", form.photo === photo && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
              >
                <Image src={photo} alt="" fill sizes="128px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <PhotoUpload label="Upload a photo of the car" value={form.photo.startsWith("/api/") ? form.photo : ""} onChange={(photo) => set("photo", photo)} />
      </section>

      {problems.message && (
        <p role="alert" className="text-sm text-destructive">
          {problems.message}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Add used car"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/admin/used-cars">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
