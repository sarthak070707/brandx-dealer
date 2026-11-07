"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addCar } from "@/app/admin/cars/actions";
import { PhotoUpload } from "@/components/admin/photo-upload";
import { blankVariant, VariantFields, type VariantForm } from "@/components/admin/variant-fields";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { BodyType } from "@/generated/prisma/enums";
import type { Option } from "@/lib/admin/price-queries";
import { BODY_TYPE_LABEL } from "@/lib/labels";

type ColourForm = { name: string; hex: string; photo: string };

const MAX_COLOURS = 6;
const MAX_VARIANTS = 6;
const blankColour = (): ColourForm => ({ name: "", hex: "#1b1c1e", photo: "" });
const sectionStyle = "flex flex-col gap-5 rounded-2xl border bg-card p-6";

export function NewCarForm({ showrooms }: { showrooms: Option[] }) {
  const router = useRouter();
  const [details, setDetails] = useState({ name: "", bodyType: "SUV" as BodyType, description: "", featured: false, demoShowroomId: "" });
  const [colours, setColours] = useState([blankColour()]);
  const [variants, setVariants] = useState([blankVariant()]);
  const [problems, setProblems] = useState<{ message: string | null; fields: Record<string, string> }>({ message: null, fields: {} });
  const [pending, startTransition] = useTransition();

  const error = (path: string) => problems.fields[path];
  const setColour = (index: number, change: Partial<ColourForm>) =>
    setColours(colours.map((colour, position) => (position === index ? { ...colour, ...change } : colour)));
  const setVariant = (index: number, value: VariantForm) => setVariants(variants.map((variant, position) => (position === index ? value : variant)));

  const submit = () =>
    startTransition(async () => {
      const result = await addCar({ ...details, colours, variants });
      if (!result.ok) return setProblems({ message: result.error, fields: result.fieldErrors ?? {} });
      toast.success(`${details.name} added. Give it a consultant under Consultants so its leads reach someone.`);
      router.push("/admin/cars");
    });

  return (
    <form
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section className={sectionStyle} aria-labelledby="car-details">
        <h2 id="car-details" className="text-xl">
          The car
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={error("name")}>
            <Input value={details.name} placeholder="Model Z" aria-invalid={Boolean(error("name"))} onChange={(event) => setDetails({ ...details, name: event.target.value })} />
          </Field>
          <Field label="Body type" error={error("bodyType")}>
            <NativeSelect value={details.bodyType} onChange={(event) => setDetails({ ...details, bodyType: event.target.value as BodyType })}>
              {Object.values(BodyType).map((type) => (
                <option key={type} value={type}>
                  {BODY_TYPE_LABEL[type]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <Field label="Description, one or two sentences" error={error("description")}>
          <Textarea rows={3} value={details.description} aria-invalid={Boolean(error("description"))} onChange={(event) => setDetails({ ...details, description: event.target.value })} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="size-4 accent-foreground" checked={details.featured} onChange={(event) => setDetails({ ...details, featured: event.target.checked })} />
          Show it on the home page
        </label>
      </section>

      <section className={sectionStyle} aria-labelledby="car-colours">
        <div>
          <h2 id="car-colours" className="text-xl">
            Colours and photos
          </h2>
          <p className="text-sm text-muted-foreground">Each colour has its own photo. The first colour&apos;s photo is the main one.</p>
        </div>
        {error("colours") && <p className="text-sm text-destructive">{error("colours")}</p>}
        {colours.map((colour, index) => (
          <div key={index} className="flex flex-wrap items-start gap-4 border-t pt-5 first:border-t-0 first:pt-0">
            <div className="w-48">
              <Field label="Colour name" error={error(`colours.${index}.name`)}>
                <Input value={colour.name} placeholder="Deep Teal" aria-invalid={Boolean(error(`colours.${index}.name`))} onChange={(event) => setColour(index, { name: event.target.value })} />
              </Field>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Swatch</span>
              <input
                type="color"
                value={colour.hex}
                aria-label={`Swatch colour ${index + 1}`}
                className="h-11 w-16 cursor-pointer rounded-lg border bg-transparent p-1"
                onChange={(event) => setColour(index, { hex: event.target.value })}
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Photo</span>
              <PhotoUpload label={`Photo for colour ${index + 1}`} value={colour.photo} error={error(`colours.${index}.photo`)} onChange={(photo) => setColour(index, { photo })} />
            </div>
            {colours.length > 1 && (
              <Button type="button" variant="ghost" size="icon" className="mt-7" aria-label={`Remove colour ${index + 1}`} onClick={() => setColours(colours.filter((_, position) => position !== index))}>
                <Trash2Icon />
              </Button>
            )}
          </div>
        ))}
        {colours.length < MAX_COLOURS && (
          <Button type="button" variant="outline" className="self-start" onClick={() => setColours([...colours, blankColour()])}>
            <PlusIcon />
            Add a colour
          </Button>
        )}
      </section>

      <section className={sectionStyle} aria-labelledby="car-variants">
        <h2 id="car-variants" className="text-xl">
          Variants
        </h2>
        {error("variants") && <p className="text-sm text-destructive">{error("variants")}</p>}
        {variants.map((variant, index) => (
          <div key={index} className="flex flex-col gap-4 border-t pt-5 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg">Variant {index + 1}</h3>
              {variants.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setVariants(variants.filter((_, position) => position !== index))}>
                  Remove
                </Button>
              )}
            </div>
            <VariantFields value={variant} onChange={(value) => setVariant(index, value)} errors={problems.fields} prefix={`variants.${index}`} />
          </div>
        ))}
        {variants.length < MAX_VARIANTS && (
          <Button type="button" variant="outline" className="self-start" onClick={() => setVariants([...variants, blankVariant()])}>
            <PlusIcon />
            Add a variant
          </Button>
        )}
      </section>

      <section className={sectionStyle} aria-labelledby="car-test-drive">
        <div>
          <h2 id="car-test-drive" className="text-xl">
            Test drives
          </h2>
          <p className="text-sm text-muted-foreground">A demo car lets buyers book a test drive of this car online. It is added for the first variant.</p>
        </div>
        <div className="max-w-xs">
          <Field label="Demo car at" error={error("demoShowroomId")}>
            <NativeSelect value={details.demoShowroomId} onChange={(event) => setDetails({ ...details, demoShowroomId: event.target.value })}>
              <option value="">No demo car yet</option>
              {showrooms.map((showroom) => (
                <option key={showroom.value} value={showroom.value}>
                  {showroom.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </section>

      {problems.message && (
        <p role="alert" className="text-sm text-destructive">
          {problems.message}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Adding…" : "Add car"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/admin/cars">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
