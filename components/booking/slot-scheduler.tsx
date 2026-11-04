import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { formatSlotTime } from "@/lib/dates";
import { slotsForDay, type ShowroomHours } from "@/lib/booking/slots";
import { cn } from "@/lib/utils";

type Props = {
  days: string[];
  hours: ShowroomHours;
  takenSlots: Set<string>;
  now: Date;
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
};

const DAY_MS = 24 * 60 * 60_000;
const MONDAY_TO_SATURDAY = 6;
const weekdayFormat = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const dayNumber = (day: string) => Number(day.slice(8));
const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

// Monday of the week a day falls in, as "YYYY-MM-DD".
function weekStart(day: string) {
  const date = toDate(day);
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - sinceMonday * DAY_MS).toISOString().slice(0, 10);
}

function weekOf(monday: string) {
  return Array.from({ length: MONDAY_TO_SATURDAY }, (_, offset) =>
    new Date(toDate(monday).getTime() + offset * DAY_MS).toISOString().slice(0, 10),
  );
}

const choiceStyle =
  "flex items-center justify-center rounded-lg border transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-40";

// Adapted from 21st.dev's delivery scheduler: a Monday-to-Saturday strip and a slot grid,
// in IST, with taken slots greyed out rather than hidden (spec).
export function SlotScheduler({ days, hours, takenSlots, now, selectedSlot, onSelect }: Props) {
  const weeks = [...new Set(days.map(weekStart))];
  const freeSlots = (day: string) =>
    slotsForDay(day, hours).filter((slot) => slot > now && !takenSlots.has(slot.toISOString()));
  const firstOpenDay = days.find((day) => freeSlots(day).length > 0) ?? days[0];
  const [selectedDay, setSelectedDay] = useState(selectedSlot ? days.find((day) => slotsForDay(day, hours).some((slot) => slot.toISOString() === selectedSlot)) ?? firstOpenDay : firstOpenDay);
  const [weekIndex, setWeekIndex] = useState(Math.max(weeks.indexOf(weekStart(selectedDay)), 0));
  const shownWeek = weekOf(weeks[weekIndex]);

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-lg">{monthFormat.format(toDate(shownWeek[0]))}</legend>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous week"
              disabled={weekIndex === 0}
              onClick={() => setWeekIndex(weekIndex - 1)}
              className="grid size-11 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next week"
              disabled={weekIndex === weeks.length - 1}
              onClick={() => setWeekIndex(weekIndex + 1)}
              className="grid size-11 place-items-center rounded-lg hover:bg-muted disabled:opacity-30"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {shownWeek.map((day) => (
            <label key={day} className="flex cursor-pointer flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{weekdayFormat.format(toDate(day))}</span>
              <input
                type="radio"
                name="day"
                value={day}
                checked={day === selectedDay}
                disabled={!days.includes(day) || freeSlots(day).length === 0}
                onChange={() => setSelectedDay(day)}
                className="peer sr-only"
              />
              <span className={cn(choiceStyle, "size-11 tabular-nums")}>{dayNumber(day)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm text-muted-foreground">Time (IST), 30 minutes</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slotsForDay(selectedDay, hours).map((slot) => {
            const iso = slot.toISOString();
            const taken = takenSlots.has(iso);
            return (
              <label key={iso} className="cursor-pointer">
                <input
                  type="radio"
                  name="slot"
                  value={iso}
                  checked={iso === selectedSlot}
                  disabled={taken || slot <= now}
                  onChange={() => onSelect(iso)}
                  className="peer sr-only"
                />
                <span className={cn(choiceStyle, "h-11 text-sm tabular-nums", taken && "line-through")}>
                  {formatSlotTime(slot)}
                  {taken && <span className="sr-only"> (taken)</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
