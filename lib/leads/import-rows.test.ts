import { describe, expect, it } from "vitest";
import type { LeadRecord } from "./csv";
import { checkRows, markExistingDuplicates, matchModel, parseReceived, summarise, type ImportContext } from "./import-rows";

const NOW = new Date("2026-11-07T10:00:00Z");
const context: ImportContext = {
  models: [{ id: "mh", name: "Model H" }, { id: "mc", name: "Model C" }, { id: "mhx", name: "Model H Extra" }],
  cities: [{ id: "lko", name: "Lucknow" }, { id: "knp", name: "Kanpur" }],
  showrooms: [{ id: "gn", name: "Gomti Nagar", cityId: "lko" }, { id: "kn", name: "Kanpur Central", cityId: "knp" }],
  defaultShowroomId: "gn",
  lockedToDefault: false,
  now: NOW,
};
const record = (overrides: Partial<LeadRecord> = {}): LeadRecord => ({ line: 2, name: "Asha Verma", phone: "98765 43210", car: "Model H", city: "", message: "", received: "", showroom: "", ...overrides });

describe("matchModel", () => {
  it("finds a model inside longer text, and prefers the longest name", () => {
    expect(matchModel("Interested in model c ZX", context.models)?.id).toBe("mc");
    expect(matchModel("Model H Extra automatic", context.models)?.id).toBe("mhx");
  });

  it("finds nothing for a car we don't sell or for no car", () => {
    expect(matchModel("Hyundai Creta", context.models)).toBeNull();
    expect(matchModel("", context.models)).toBeNull();
  });
});

describe("parseReceived", () => {
  it("reads year-first and day-first dates", () => {
    expect(parseReceived("2026-11-03", NOW)).toEqual(new Date("2026-11-03T00:00:00Z"));
    expect(parseReceived("03-11-2026", NOW)).toEqual(new Date("2026-11-03T00:00:00Z"));
    expect(parseReceived("3/11/2026", NOW)).toEqual(new Date("2026-11-03T00:00:00Z"));
  });

  it("treats empty as now-ish, and a future date as now", () => {
    expect(parseReceived("  ", NOW)).toBeNull();
    expect(parseReceived("01-01-2030", NOW)).toEqual(NOW);
  });

  it("refuses a date that isn't real or isn't a date", () => {
    for (const text of ["31-02-2026", "13/13/2026", "yesterday", "2026-11", "11-03-26"]) expect(parseReceived(text, NOW), text).toBe("invalid");
  });
});

describe("checkRows", () => {
  it("turns a good row into a lead with the phone number tidied and the car matched", () => {
    const [row] = checkRows([record({ message: "Call after 5", received: "05-11-2026" })], context);
    expect(row.status).toBe("ready");
    expect(row.lead).toEqual({
      buyerName: "Asha Verma",
      buyerPhone: "+919876543210",
      modelId: "mh",
      showroomId: "gn",
      cityId: "lko",
      message: "Call after 5",
      createdAt: new Date("2026-11-05T00:00:00Z"),
    });
  });

  it("explains each reason a row can't be used, by row", () => {
    const rows = checkRows(
      [record({ line: 2, name: "A" }), record({ line: 3, phone: "12345" }), record({ line: 4, received: "someday" }), record({ line: 5 })],
      { ...context, defaultShowroomId: null },
    );
    expect(rows.map((row) => [row.line, row.status, row.problem])).toEqual([
      [2, "invalid", "The name is missing"],
      [3, "invalid", "The phone number isn't a valid Indian mobile number"],
      [4, "invalid", "The date isn't understood. Use DD-MM-YYYY, like 07-11-2026"],
      [5, "invalid", "There is no showroom for this row"],
    ]);
  });

  it("keeps a car we can't match in the message rather than losing it", () => {
    const [row] = checkRows([record({ car: "Hyundai Creta", message: "Wants EMI" })], context);
    expect(row.lead).toMatchObject({ modelId: undefined, message: "Interested in: Hyundai Creta. Wants EMI" });
  });

  it("uses the showroom or city a row names, but a consultant's rows always go to their own showroom", () => {
    const named = checkRows([record({ showroom: "kanpur central" }), record({ phone: "9876500001", city: "Kanpur" })], context);
    expect(named.map((row) => row.lead?.showroomId)).toEqual(["kn", "kn"]);

    const locked = checkRows([record({ showroom: "Kanpur Central" })], { ...context, lockedToDefault: true });
    expect(locked[0].lead?.showroomId).toBe("gn");
  });

  it("skips a second row for the same phone and car within the file, but not the same phone with another car", () => {
    const rows = checkRows([record({ line: 2 }), record({ line: 3 }), record({ line: 4, car: "Model C" })], context);
    expect(rows.map((row) => row.status)).toEqual(["ready", "duplicate", "ready"]);
    expect(rows[1].problem).toBe("The same phone number and car appear earlier in the file");
  });
});

describe("markExistingDuplicates", () => {
  const days = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60_000);

  it("skips a buyer who already has a lead for the same car at around the same time, so a second import adds nothing", () => {
    const rows = checkRows([record({ line: 2 }), record({ line: 3, phone: "9876500001" }), record({ line: 4, car: "" })], context);
    const checked = markExistingDuplicates(rows, [{ buyerPhone: "+919876543210", modelId: "mh", createdAt: days(3) }]);
    expect(checked.map((row) => row.status)).toEqual(["duplicate", "ready", "ready"]);
    expect(checked[0].lead).toBeNull();
  });

  it("measures 'around the same time' from the date on the row, so re-importing an old file is still caught", () => {
    const rows = checkRows([record({ received: "01-10-2026" })], context);
    expect(markExistingDuplicates(rows, [{ buyerPhone: "+919876543210", modelId: "mh", createdAt: new Date("2026-10-02T00:00:00Z") }])[0].status).toBe("duplicate");
  });

  it("treats the same buyer asking about the same car months later as a new lead", () => {
    const rows = checkRows([record()], context);
    expect(markExistingDuplicates(rows, [{ buyerPhone: "+919876543210", modelId: "mh", createdAt: days(90) }])[0].status).toBe("ready");
  });

  it("does not mix up a different car or a lead with no car", () => {
    const rows = checkRows([record({ car: "Model C" })], context);
    expect(markExistingDuplicates(rows, [{ buyerPhone: "+919876543210", modelId: "mh", createdAt: days(1) }])[0].status).toBe("ready");
    expect(markExistingDuplicates(rows, [{ buyerPhone: "+919876543210", modelId: null, createdAt: days(1) }])[0].status).toBe("ready");
  });
});

describe("summarise", () => {
  it("counts each kind of row", () => {
    const rows = checkRows([record({ line: 2 }), record({ line: 3 }), record({ line: 4, name: "" })], context);
    expect(summarise(rows)).toEqual({ ready: 1, duplicate: 1, invalid: 1 });
  });
});
