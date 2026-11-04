// A8: 30-minute slots inside showroom hours, Monday to Saturday, from now up to 14 days ahead.
export const SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 14;

const MINUTE_MS = 60_000;
const IST_OFFSET_MINUTES = 330;
const SUNDAY = 0;

export type ShowroomHours = { openMinute: number; closeMinute: number };

// A calendar day in India as "YYYY-MM-DD".
export function istDay(instant: Date) {
  return new Date(instant.getTime() + IST_OFFSET_MINUTES * MINUTE_MS).toISOString().slice(0, 10);
}

const dayToUtcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);
const addDays = (day: string, days: number) =>
  new Date(dayToUtcMidnight(day).getTime() + days * 24 * 60 * MINUTE_MS).toISOString().slice(0, 10);
const isSunday = (day: string) => dayToUtcMidnight(day).getUTCDay() === SUNDAY;

export function bookingDays(now: Date) {
  const today = istDay(now);
  return Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, offset) => addDays(today, offset)).filter(
    (day) => !isSunday(day),
  );
}

// Slot start times for an IST day, as UTC instants.
export function slotsForDay(day: string, hours: ShowroomHours) {
  const midnightIst = dayToUtcMidnight(day).getTime() - IST_OFFSET_MINUTES * MINUTE_MS;
  const slots: Date[] = [];
  for (let minute = hours.openMinute; minute + SLOT_MINUTES <= hours.closeMinute; minute += SLOT_MINUTES) {
    slots.push(new Date(midnightIst + minute * MINUTE_MS));
  }
  return slots;
}

export function isBookableSlot(slotStart: Date, hours: ShowroomHours, now: Date) {
  if (slotStart <= now) return false;
  const day = istDay(slotStart);
  return bookingDays(now).includes(day) && slotsForDay(day, hours).some((slot) => slot.getTime() === slotStart.getTime());
}
