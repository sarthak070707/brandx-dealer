import type { Language } from "@/generated/prisma/enums";
import { formatSlot } from "@/lib/dates";

type ServiceType = "PERIODIC" | "REPAIR" | "ACCESSORIES" | "CHECKUP";

const SERVICE_TEXT: Record<ServiceType, string> = {
  PERIODIC: "Periodic service",
  REPAIR: "Repair",
  ACCESSORIES: "Accessories fitting",
  CHECKUP: "Check-up",
};

const kmFormat = new Intl.NumberFormat("en-IN");

type Details = { serviceType: ServiceType; slotStart: Date; vehicle: string; regNumber: string; km: number; notes: string | null };

// The lead's message, as the consultant reads it: in English, because staff screens are, with the time in IST.
export function composeServiceMessage({ serviceType, slotStart, vehicle, regNumber, km, notes }: Details) {
  return [
    `Service booking: ${SERVICE_TEXT[serviceType]} on ${formatSlot(slotStart, "en")}.`,
    `${vehicle}, ${regNumber}, ${kmFormat.format(km)} km.`,
    notes && `Notes: ${notes}`,
  ]
    .filter(Boolean)
    .join(" ");
}

const TOPIC: Record<Language, Record<ServiceType, string>> = {
  EN: { PERIODIC: "periodic service", REPAIR: "repair", ACCESSORIES: "accessories fitting", CHECKUP: "check-up" },
  HI: { PERIODIC: "पीरियॉडिक सर्विस", REPAIR: "रिपेयर", ACCESSORIES: "एक्सेसरीज़ फ़िटिंग", CHECKUP: "चेक-अप" },
};

// Fills the "thanks for your interest in the ..." of the acknowledgement message.
export const serviceTopic = (language: Language, serviceType: ServiceType) => TOPIC[language][serviceType];
