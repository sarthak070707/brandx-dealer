// Each showroom's service bays. A slot is full when every bay is taken.
export const SERVICE_BAYS = 3;

// Slot start times (as ISO strings) where every bay has a confirmed booking.
export function fullSlots(confirmedSlotStarts: Date[]) {
  const counts = new Map<string, number>();
  for (const start of confirmedSlotStarts) counts.set(start.toISOString(), (counts.get(start.toISOString()) ?? 0) + 1);
  return [...counts].filter(([, count]) => count >= SERVICE_BAYS).map(([iso]) => iso);
}

// The bays nobody has, lowest first; none when the slot is full.
export const freeBays = (takenBays: number[]) => Array.from({ length: SERVICE_BAYS }, (_, index) => index + 1).filter((bay) => !takenBays.includes(bay));
