const INDIAN_REGISTRATION = /^([A-Z]{2}\d{1,2})([A-Z]{0,3})(\d{1,4})$/;

// "UP32MN2741" becomes "UP32 •• ••41": buyers see the state and RTO, never the full number.
export function maskRegistration(registration: string) {
  const match = INDIAN_REGISTRATION.exec(registration.replace(/\s+/g, "").toUpperCase());
  if (!match) return "Hidden until purchase";
  const [, rto, series, number] = match;
  const hiddenSeries = "•".repeat(series.length);
  const hiddenNumber = "•".repeat(Math.max(number.length - 2, 0)) + number.slice(-2);
  return [rto, hiddenSeries, hiddenNumber].filter(Boolean).join(" ");
}
