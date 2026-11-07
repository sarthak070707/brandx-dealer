import { describe, expect, it } from "vitest";
import { buildInspectionReport, INSPECTION_AREAS, nextStockId, resultsFromReport } from "./used-car-report";

describe("buildInspectionReport", () => {
  it("names each area in order and writes the date as a plain day", () => {
    const report = buildInspectionReport({ score: 84, inspectedOn: new Date("2026-11-03T00:00:00Z"), results: ["PASS", "PASS", "PASS", "PASS", "PASS", "ATTENTION"] });
    expect(report.score).toBe(84);
    expect(report.inspectedOn).toBe("2026-11-03");
    expect(report.checks.map((check) => check.area)).toEqual([...INSPECTION_AREAS]);
    expect(report.checks.at(-1)).toEqual({ area: "Tyres", result: "ATTENTION" });
  });
});

describe("resultsFromReport", () => {
  it("reads the results back in the form's order, and treats a missing area as passed", () => {
    const stored = [
      { area: "Tyres", result: "ATTENTION" as const },
      { area: "Body and paint", result: "ATTENTION" as const },
    ];
    expect(resultsFromReport(stored)).toEqual(["PASS", "PASS", "ATTENTION", "PASS", "PASS", "ATTENTION"]);
  });

  it("round-trips with buildInspectionReport", () => {
    const results = ["ATTENTION", "PASS", "PASS", "ATTENTION", "PASS", "PASS"] as const;
    const report = buildInspectionReport({ score: 80, inspectedOn: new Date("2026-01-01T00:00:00Z"), results: [...results] });
    expect(resultsFromReport(report.checks)).toEqual([...results]);
  });
});

describe("nextStockId", () => {
  it("is one more than the highest number in stock", () => {
    expect(nextStockId(["UC-1182", "UC-1227", "UC-1190"])).toBe("UC-1228");
  });

  it("ignores ids that are not in the UC-number form", () => {
    expect(nextStockId(["OLD-9999", "UC-12", "uc-5000"])).toBe("UC-13");
  });

  it("starts at UC-1001 when there is no stock", () => {
    expect(nextStockId([])).toBe("UC-1001");
  });
});
