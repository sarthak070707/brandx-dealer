// The six areas every used car is inspected on, in the order they are shown.
export const INSPECTION_AREAS = [
  "Engine and transmission",
  "Suspension and brakes",
  "Body and paint",
  "Electricals",
  "Interior",
  "Tyres",
] as const;

export type InspectionResult = "PASS" | "ATTENTION";

// The form holds one result per area, in the order above; the database holds named checks.
export function buildInspectionReport({ score, inspectedOn, results }: { score: number; inspectedOn: Date; results: InspectionResult[] }) {
  return {
    score,
    inspectedOn: inspectedOn.toISOString().slice(0, 10),
    checks: INSPECTION_AREAS.map((area, index) => ({ area, result: results[index] ?? "PASS" })),
  };
}

// Back from the stored report to one result per area; an area the report doesn't mention counts as passed.
export function resultsFromReport(checks: { area: string; result: InspectionResult }[]): InspectionResult[] {
  return INSPECTION_AREAS.map((area) => checks.find((check) => check.area === area)?.result ?? "PASS");
}

// UC-1182 comes after UC-1181. With no stock yet the numbering starts at UC-1001.
export function nextStockId(existing: string[]) {
  const numbers = existing.flatMap((stockId) => {
    const match = /^UC-(\d+)$/.exec(stockId);
    return match ? [Number(match[1])] : [];
  });
  return `UC-${numbers.length > 0 ? Math.max(...numbers) + 1 : 1001}`;
}
