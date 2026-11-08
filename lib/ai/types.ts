import type { Language, LeadSource } from "@/generated/prisma/enums";

export type PriceFact = { label: string; paise: number };

// Everything the AI may see about a lead, and nothing else: no name, phone or email.
export type AiLeadFacts = {
  source: LeadSource;
  language: Language;
  city: string;
  message: string | null;
  model: string | null;
  variant: string | null;
  // What the lead's variant really is, from the car's own data. The only seats, gearbox and fuel a reply may state.
  specs: { seats: number; gearbox: string; fuel: string } | null;
  usedCar: { label: string; year: number; km: number } | null;
  testDrive: { when: string; showroom: string } | null;
  // The only amounts a reply may quote, all from the admin tables.
  prices: PriceFact[];
};

// Filled into the draft on our server, so the model never needs the real values.
export type DraftNames = { name: string; consultant: string | null; showroom: string };

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
