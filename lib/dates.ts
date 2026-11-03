const IST_OFFSET_MS = 330 * 60_000;

// Price validity is a calendar date in India, stored as midnight UTC (Postgres DATE).
export function indiaToday(now: Date) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

// Showroom hours are stored as minutes after midnight IST, e.g. 600 → "10:00".
export function formatClock(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}
