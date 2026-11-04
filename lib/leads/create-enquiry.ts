import { z } from "zod";
import { db } from "@/lib/db";
import { createLead } from "@/lib/leads/create-lead";
import { enquirySchema, type EnquiryInput } from "@/lib/leads/enquiry-schema";
import { isRateLimited, RATE_LIMITED_MESSAGE } from "@/lib/leads/rate-limit";

export type EnquiryResult =
  | { ok: true; consultantName: string | null; showroomName: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const NOT_FOUND = { ok: false, error: "We couldn't find that car. Please refresh the page and try again." } as const;

type LeadTarget = { modelId: string; variantId?: string; usedCarId?: string; cityId: string; showroomId: string; carLabel: string };

// Resolves what the buyer was looking at from the database; ids from the browser are only lookups.
async function resolveTarget(target: z.output<typeof enquirySchema>["target"]): Promise<LeadTarget | { error: string }> {
  if (target.type === "used") {
    const car = await db.usedCar.findUnique({
      where: { stockId: target.stockId },
      select: { id: true, status: true, modelId: true, variantName: true, model: { select: { name: true } }, showroom: { select: { id: true, cityId: true } } },
    });
    if (!car) return NOT_FOUND;
    if (car.status === "SOLD") return { error: "This car has just been sold." };
    return {
      modelId: car.modelId,
      usedCarId: car.id,
      cityId: car.showroom.cityId,
      showroomId: car.showroom.id,
      carLabel: `${car.model.name} ${car.variantName} (${target.stockId})`,
    };
  }

  const [model, city, showroom] = await Promise.all([
    db.model.findUnique({
      where: { slug: target.modelSlug },
      select: { id: true, name: true, variants: { where: { id: target.variantId }, select: { id: true, name: true } } },
    }),
    db.city.findUnique({ where: { id: target.cityId }, select: { id: true } }),
    db.showroom.findUnique({ where: { id: target.showroomId }, select: { id: true } }),
  ]);
  const variant = model?.variants[0];
  if (!model || !variant || !city || !showroom) return NOT_FOUND;
  return {
    modelId: model.id,
    variantId: variant.id,
    cityId: city.id,
    showroomId: showroom.id,
    carLabel: `${model.name} ${variant.name}`,
  };
}

export async function createEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { target, message, buyerName, buyerPhone, language } = parsed.data;

  const resolved = await resolveTarget(target);
  if ("error" in resolved) return { ok: false, error: resolved.error };
  if (await isRateLimited(buyerPhone)) return { ok: false, error: RATE_LIMITED_MESSAGE };

  const { carLabel, ...car } = resolved;
  const { consultantName, showroomName } = await db.$transaction((tx) =>
    createLead(tx, { source: "ENQUIRY", buyerName, buyerPhone, language, message: message ?? undefined, carLabel, ...car }),
  );
  return { ok: true, consultantName, showroomName };
}
