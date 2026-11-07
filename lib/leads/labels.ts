import type { LeadSource, LeadStatus } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  TEST_DRIVE_BOOKED: "Test drive booked",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  ENQUIRY: "Enquiry",
  TEST_DRIVE: "Test drive",
  TRADE_IN: "Trade-in",
};
