import type { LeadStatus } from "@/generated/prisma/enums";

const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const GREEN_UNDER_MS = 5 * MINUTE_MS;
const AMBER_UP_TO_MS = 15 * MINUTE_MS;

export type TimerTone = "green" | "amber" | "red";
export type ResponseTimer =
  | { kind: "running"; elapsedMs: number; tone: TimerTone }
  | { kind: "met"; elapsedMs: number; tone: TimerTone }
  | { kind: "none" };

// Spec: green under 5 minutes, amber 5 to 15, red after.
export const timerTone = (elapsedMs: number): TimerTone =>
  elapsedMs < GREEN_UNDER_MS ? "green" : elapsedMs <= AMBER_UP_TO_MS ? "amber" : "red";

type TimedLead = { status: LeadStatus; createdAt: Date; firstContactAt: Date | null };

// A13: the timer runs from creation until the consultant marks the lead Contacted.
export function responseTimer(lead: TimedLead, now: Date): ResponseTimer {
  if (lead.firstContactAt) {
    const elapsedMs = Math.max(0, lead.firstContactAt.getTime() - lead.createdAt.getTime());
    return { kind: "met", elapsedMs, tone: timerTone(elapsedMs) };
  }
  if (lead.status !== "NEW") return { kind: "none" };
  const elapsedMs = Math.max(0, now.getTime() - lead.createdAt.getTime());
  return { kind: "running", elapsedMs, tone: timerTone(elapsedMs) };
}

const twoDigits = (value: number) => String(value).padStart(2, "0");

// A running timer: "03:12" under an hour, then "2h 05m" and "3d 4h".
export function formatRunningTime(ms: number) {
  if (ms < HOUR_MS) return `${twoDigits(Math.floor(ms / MINUTE_MS))}:${twoDigits(Math.floor((ms % MINUTE_MS) / SECOND_MS))}`;
  if (ms < DAY_MS) return `${Math.floor(ms / HOUR_MS)}h ${twoDigits(Math.floor((ms % HOUR_MS) / MINUTE_MS))}m`;
  return `${Math.floor(ms / DAY_MS)}d ${Math.floor((ms % DAY_MS) / HOUR_MS)}h`;
}

// A finished response time: "45s", "4m 12s", "2h 5m", "3d 4h".
export function formatDuration(ms: number) {
  if (ms < MINUTE_MS) return `${Math.floor(ms / SECOND_MS)}s`;
  if (ms < HOUR_MS) return `${Math.floor(ms / MINUTE_MS)}m ${Math.floor((ms % MINUTE_MS) / SECOND_MS)}s`;
  if (ms < DAY_MS) return `${Math.floor(ms / HOUR_MS)}h ${Math.floor((ms % HOUR_MS) / MINUTE_MS)}m`;
  return `${Math.floor(ms / DAY_MS)}d ${Math.floor((ms % DAY_MS) / HOUR_MS)}h`;
}

export function formatAgo(ms: number) {
  if (ms < MINUTE_MS) return "just now";
  if (ms < HOUR_MS) return `${Math.floor(ms / MINUTE_MS)} min ago`;
  if (ms < DAY_MS) return `${Math.floor(ms / HOUR_MS)} h ago`;
  return `${Math.floor(ms / DAY_MS)} d ago`;
}
