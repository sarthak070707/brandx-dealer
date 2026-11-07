import { intlTag } from "@/i18n/format";

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

const formatters = new Map<string, Intl.DateTimeFormat>();

// One formatter per language and style, made once. Staff screens use English (the default).
function formatterFor(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  const existing = formatters.get(key);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat(intlTag(locale), options);
  formatters.set(key, created);
  return created;
}

// "31 Jan 2027"; UTC because validity dates are stored as midnight UTC.
export function formatDate(date: Date, locale = "en") {
  return formatterFor(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

// Test-drive times are stored in UTC and always shown in IST.
export function formatSlotTime(instant: Date, locale = "en") {
  return formatterFor(locale, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(instant);
}

export function formatSlot(instant: Date, locale = "en") {
  const day = formatterFor(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  return `${day.format(instant)}, ${formatSlotTime(instant, locale)}`;
}

// The weekday ("Wed") and month ("November 2026") of a calendar day held as midnight UTC.
export const formatWeekday = (date: Date, locale = "en") => formatterFor(locale, { weekday: "short", timeZone: "UTC" }).format(date);
export const formatMonthYear = (date: Date, locale = "en") =>
  formatterFor(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);

// The instant an IST calendar day began, for "created today" style filters.
export function startOfIstDay(now: Date) {
  return new Date(indiaToday(now).getTime() - IST_OFFSET_MS);
}
