import type { BodyType, Fuel, Transmission } from "@/generated/prisma/enums";

export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  HATCHBACK: "Hatchback",
  SEDAN: "Sedan",
  SUV: "SUV",
  MPV: "MPV",
  COUPE: "Coupe",
};

export const FUEL_LABEL: Record<Fuel, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
};

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
};
