import { describe, expect, it } from "vitest";
import { composeServiceMessage, serviceTopic } from "./message";

describe("composeServiceMessage", () => {
  const details = { serviceType: "PERIODIC" as const, slotStart: new Date("2026-11-12T05:30:00Z"), vehicle: "Maruti Swift VXi", regNumber: "UP32AB1234", km: 62_000, notes: null };

  it("states the service, the time in IST, the car, its registration and distance", () => {
    expect(composeServiceMessage(details)).toBe("Service booking: Periodic service on Thu, 12 Nov, 11:00 am. Maruti Swift VXi, UP32AB1234, 62,000 km.");
  });

  it("adds the customer's notes when there are any", () => {
    expect(composeServiceMessage({ ...details, serviceType: "REPAIR", notes: "Brakes squeal" })).toContain("Repair on");
    expect(composeServiceMessage({ ...details, notes: "Brakes squeal" }).endsWith("Notes: Brakes squeal")).toBe(true);
  });
});

describe("serviceTopic", () => {
  it("reads naturally in the acknowledgement in each language", () => {
    expect(serviceTopic("EN", "ACCESSORIES")).toBe("accessories fitting");
    expect(serviceTopic("HI", "PERIODIC")).toBe("पीरियॉडिक सर्विस");
  });
});
