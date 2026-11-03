const IST_OFFSET_MS = 330 * 60_000;

// Price validity is a calendar date in India, stored as midnight UTC (Postgres DATE).
export function indiaToday(now: Date) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}
