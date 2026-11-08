import bcrypt from "bcryptjs";
import type { LeadStatus } from "../generated/prisma/enums";
import { db } from "../lib/db";
import { acknowledgement } from "../lib/leads/acknowledgement";
import {
  ADMIN,
  CITIES,
  CONSULTANTS,
  DEMO_BUYER,
  DEMO_CARS,
  DEMO_PASSWORD,
  INSPECTION_AREAS,
  INSURANCE_GAPS,
  INSURANCE_OFFSET_FROM_LUCKNOW_RUPEES,
  LEADS,
  MODELS,
  ROAD_TAX_SLABS,
  SHOWROOMS,
  USED_CARS,
  type CityName,
  type ShowroomName,
} from "./seed-data";

type LeadSeed = (typeof LEADS)[number];
type CarRef = { modelId: string; label: string };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const IST_OFFSET_MINUTES = 330;
const MODEL_YEAR = 2026;

const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const paise = (rupees: number) => rupees * 100;
const daysFromToday = (days: number) => new Date(today.getTime() + days * DAY);
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * MINUTE);

// A7: relative to the seed date, so a fresh seed never shows expired prices.
const CURRENT = { validFrom: daysFromToday(-30), validTo: daysFromToday(90) };
const EXPIRED = { validFrom: daysFromToday(-150), validTo: daysFromToday(-31) };

// A8: an IST wall-clock slot on a showroom day (Sundays roll to Monday), stored in UTC.
function istSlot(daysAhead: number, time: string) {
  const istNow = new Date(now.getTime() + IST_OFFSET_MINUTES * MINUTE);
  const day = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + daysAhead),
  );
  if (day.getUTCDay() === 0) day.setUTCDate(day.getUTCDate() + 1);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(day.getTime() + (hours * 60 + minutes - IST_OFFSET_MINUTES) * MINUTE);
}

async function clearDatabase() {
  await db.$transaction([
    db.outboxMessage.deleteMany(),
    db.aiDraft.deleteMany(),
    db.leadEvent.deleteMany(),
    db.testDriveBooking.deleteMany(),
    db.serviceBooking.deleteMany(),
    db.lead.deleteMany(),
    db.demoCar.deleteMany(),
    db.usedCar.deleteMany(),
    db.accessoryPackage.deleteMany(),
    db.insuranceRate.deleteMany(),
    db.roadTaxRule.deleteMany(),
    db.variantPrice.deleteMany(),
    db.consultantModel.deleteMany(),
    db.user.deleteMany(),
    db.variant.deleteMany(),
    db.carPhoto.deleteMany(),
    db.model.deleteMany(),
    db.showroom.deleteMany(),
    db.city.deleteMany(),
  ]);
}

async function seedPlaces() {
  const cities = await Promise.all(CITIES.map((name) => db.city.create({ data: { name } })));
  const cityIds = Object.fromEntries(cities.map((city) => [city.name, city.id])) as Record<CityName, string>;

  const showrooms = await Promise.all(
    SHOWROOMS.map((showroom) => db.showroom.create({ data: { ...showroom, cityId: cityIds.Lucknow } })),
  );
  const showroomIds = Object.fromEntries(
    showrooms.map((showroom) => [showroom.name, showroom.id]),
  ) as Record<ShowroomName, string>;

  await db.roadTaxRule.createMany({
    data: CITIES.flatMap((city) =>
      ROAD_TAX_SLABS.map((slab) => ({
        cityId: cityIds[city],
        fuel: slab.fuel,
        slabMinPaise: paise(slab.minRupees),
        slabMaxPaise: slab.maxRupees === null ? null : paise(slab.maxRupees),
        rateBasisPoints: slab.basisPoints,
        ...CURRENT,
      })),
    ),
  });

  return { cityIds, showroomIds };
}

function insuranceRates(modelSlug: string, lucknowRupees: number, cityIds: Record<CityName, string>) {
  const hasRate = (city: CityName) =>
    !INSURANCE_GAPS.some((gap) => gap.city === city && gap.modelSlug === modelSlug);

  return CITIES.filter(hasRate).map((city) => ({
    cityId: cityIds[city],
    premiumPaise: paise(lucknowRupees + INSURANCE_OFFSET_FROM_LUCKNOW_RUPEES[city]),
    ...CURRENT,
  }));
}

async function seedCatalogue(cityIds: Record<CityName, string>) {
  const modelIds = new Map<string, string>();
  const variants = new Map<string, CarRef & { id: string }>();

  for (const model of MODELS) {
    const created = await db.model.create({
      data: {
        slug: model.slug,
        name: model.name,
        bodyType: model.bodyType,
        description: model.description,
        photos: model.colours.map((colour) => colour.photo),
        featured: model.featured,
        accessoryPackages: {
          create: model.accessories.map((pack) => ({
            name: pack.name,
            pricePaise: paise(pack.rupees),
            items: pack.items,
            ...CURRENT,
          })),
        },
        variants: {
          create: model.variants.map((variant) => ({
            code: variant.code,
            name: variant.name,
            fuel: variant.fuel,
            transmission: variant.transmission,
            modelYear: MODEL_YEAR,
            specs: variant.specs,
            colours: model.colours,
            prices: { create: { exShowroomPaise: paise(variant.exShowroomRupees), ...CURRENT } },
            insuranceRates: { create: insuranceRates(model.slug, variant.lucknowInsuranceRupees, cityIds) },
          })),
        },
      },
      include: { variants: true },
    });

    modelIds.set(model.slug, created.id);
    for (const variant of created.variants) {
      variants.set(variant.code, { id: variant.id, modelId: created.id, label: `${model.name} ${variant.name}` });
    }
  }

  // An older, expired price version, so only the row valid today is ever used (A7).
  await db.variantPrice.create({
    data: { variantId: variants.get("NEW-H-02")!.id, exShowroomPaise: paise(12_20_000), ...EXPIRED },
  });

  return { modelIds, variants };
}

function inspectionReport(score: number, needsAttention: string[]) {
  return {
    score,
    inspectedOn: daysFromToday(-10).toISOString().slice(0, 10),
    checks: INSPECTION_AREAS.map((area) => ({
      area,
      result: needsAttention.includes(area) ? "ATTENTION" : "PASS",
    })),
  };
}

async function seedStock(
  modelIds: Map<string, string>,
  variants: Map<string, { id: string }>,
  showroomIds: Record<ShowroomName, string>,
) {
  const modelNames = new Map(MODELS.map((model) => [model.slug, model.name]));

  // Used cars show their model in its second colour, so they don't repeat the new-car photo.
  const usedCarPhoto = new Map(MODELS.map((model) => [model.slug, model.colours.at(-1)!.photo]));

  const usedCars = await db.usedCar.createManyAndReturn({
    data: USED_CARS.map(({ modelSlug, showroom, rupees, inspectionScore, needsAttention, ...car }) => ({
      ...car,
      modelId: modelIds.get(modelSlug)!,
      showroomId: showroomIds[showroom],
      pricePaise: paise(rupees),
      inspectionReport: inspectionReport(inspectionScore, needsAttention),
      photos: [usedCarPhoto.get(modelSlug)!],
    })),
  });

  const demoCars = await db.demoCar.createManyAndReturn({
    data: DEMO_CARS.map((car) => ({
      showroomId: showroomIds[car.showroom],
      variantId: variants.get(car.variantCode)!.id,
      available: car.available,
    })),
  });

  return {
    usedCars: new Map(
      usedCars.map((car) => {
        const modelSlug = USED_CARS.find((seed) => seed.stockId === car.stockId)!.modelSlug;
        const label = `${modelNames.get(modelSlug)} ${car.variantName} (${car.stockId})`;
        return [car.stockId, { id: car.id, modelId: car.modelId, label }];
      }),
    ),
    demoCarIds: new Map(
      demoCars.map((car, index) => [`${DEMO_CARS[index].showroom}:${DEMO_CARS[index].variantCode}`, car.id]),
    ),
  };
}

async function seedPeople(showroomIds: Record<ShowroomName, string>, modelIds: Map<string, string>) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await db.user.create({ data: { ...ADMIN, passwordHash, role: "ADMIN" } });
  const buyer = await db.user.create({
    data: { name: DEMO_BUYER.name, email: DEMO_BUYER.email, passwordHash, role: "BUYER" },
  });

  const consultants = await Promise.all(
    CONSULTANTS.map((consultant) =>
      db.user.create({
        data: {
          name: consultant.name,
          email: consultant.email,
          passwordHash,
          role: "CONSULTANT",
          showroomId: showroomIds[consultant.showroom],
          models: { create: consultant.modelSlugs.map((slug) => ({ modelId: modelIds.get(slug)! })) },
        },
      }),
    ),
  );

  return { buyerId: buyer.id, consultants: new Map(consultants.map((user) => [user.email, user])) };
}

const PIPELINE: LeadStatus[] = ["NEW", "CONTACTED", "TEST_DRIVE_BOOKED", "NEGOTIATION", "WON"];

function statusPath(status: LeadStatus): LeadStatus[] {
  if (status === "LOST") return ["NEW", "CONTACTED", "LOST"];
  return PIPELINE.slice(0, PIPELINE.indexOf(status) + 1);
}

function statusEvents(lead: LeadSeed, firstContactAt: Date | null, actorId: string | undefined) {
  if (!firstContactAt) return [];
  const path = statusPath(lead.status);
  const gap = (now.getTime() - firstContactAt.getTime()) / path.length;

  return path.slice(1).map((to, index) => ({
    type: "STATUS" as const,
    actorId,
    createdAt: new Date(firstContactAt.getTime() + index * gap),
    details: { from: path[index], to, ...(to === "LOST" && { lostReason: lead.lostReason }) },
  }));
}

async function main() {
  await clearDatabase();
  const { cityIds, showroomIds } = await seedPlaces();
  const { modelIds, variants } = await seedCatalogue(cityIds);
  const { usedCars, demoCarIds } = await seedStock(modelIds, variants, showroomIds);
  const { buyerId, consultants } = await seedPeople(showroomIds, modelIds);
  const lastAssignedAt = new Map<string, Date>();

  for (const lead of LEADS) {
    const createdAt = minutesAgo(lead.minutesAgo);
    const consultant = lead.consultantEmail ? consultants.get(lead.consultantEmail)! : undefined;
    const car = "variantCode" in lead.car ? variants.get(lead.car.variantCode)! : usedCars.get(lead.car.stockId)!;
    const firstContactAt =
      lead.contactedAfterMinutes === undefined ? null : new Date(createdAt.getTime() + lead.contactedAfterMinutes * MINUTE);
    const buyerEmail = lead.isDemoBuyer ? DEMO_BUYER.email : null;

    const created = await db.lead.create({
      data: {
        source: lead.source,
        buyerName: lead.buyerName,
        buyerPhone: lead.phone,
        buyerEmail,
        language: lead.language,
        message: lead.message,
        modelId: car.modelId,
        variantId: "variantCode" in lead.car ? car.id : null,
        usedCarId: "stockId" in lead.car ? car.id : null,
        cityId: cityIds[lead.city],
        showroomId: showroomIds[lead.showroom],
        assignedToId: consultant?.id,
        status: lead.status,
        lostReason: lead.lostReason,
        consentAt: createdAt,
        createdAt,
        firstContactAt,
        events: {
          create: [
            {
              type: "ASSIGNED",
              createdAt,
              details: consultant
                ? { reason: "auto", toUserId: consultant.id }
                : { reason: "no-eligible-consultant", toUserId: null },
            },
            { type: "MESSAGE", createdAt, details: { channel: "WHATSAPP", simulated: true } },
            ...statusEvents(lead, firstContactAt, consultant?.id),
          ],
        },
        outbox: {
          create: { channel: "WHATSAPP", body: acknowledgement({
              language: lead.language,
              buyerName: lead.buyerName,
              carLabel: car.label,
              showroomName: lead.showroom,
              consultantName: consultant?.name ?? null,
            }), createdAt },
        },
      },
    });

    if (lead.booking && "variantCode" in lead.car) {
      await db.testDriveBooking.create({
        data: {
          demoCarId: demoCarIds.get(`${lead.showroom}:${lead.car.variantCode}`)!,
          slotStart: istSlot(lead.booking.daysAhead, lead.booking.time),
          buyerName: lead.buyerName,
          buyerPhone: lead.phone,
          buyerEmail,
          language: lead.language,
          consentAt: createdAt,
          status: lead.booking.cancelled ? "CANCELLED" : "CONFIRMED",
          buyerId: lead.isDemoBuyer ? buyerId : null,
          leadId: created.id,
          createdAt,
        },
      });
    }

    if (consultant && createdAt > (lastAssignedAt.get(consultant.id) ?? new Date(0))) {
      lastAssignedAt.set(consultant.id, createdAt);
    }
  }

  await Promise.all(
    [...lastAssignedAt].map(([id, at]) => db.user.update({ where: { id }, data: { lastAssignedAt: at } })),
  );
}

try {
  await main();
} finally {
  await db.$disconnect();
}
