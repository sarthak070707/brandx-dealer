import { describe, expect, it } from "vitest";
import { formatAgo, formatDuration, formatRunningTime, responseTimer, timerTone } from "./timer";

const MIN = 60_000;
const created = new Date("2026-11-03T10:00:00Z");
const after = (ms: number) => new Date(created.getTime() + ms);

describe("timerTone", () => {
  it("is green under 5 minutes, amber from 5 to 15, red after", () => {
    expect(timerTone(0)).toBe("green");
    expect(timerTone(5 * MIN - 1)).toBe("green");
    expect(timerTone(5 * MIN)).toBe("amber");
    expect(timerTone(15 * MIN)).toBe("amber");
    expect(timerTone(15 * MIN + 1)).toBe("red");
  });
});

describe("responseTimer", () => {
  it("runs from creation while a new lead has not been contacted", () => {
    expect(responseTimer({ status: "NEW", createdAt: created, firstContactAt: null }, after(3 * MIN))).toEqual({
      kind: "running",
      elapsedMs: 3 * MIN,
      tone: "green",
    });
  });

  it("stops at first contact and judges the response time it took", () => {
    const lead = { status: "NEGOTIATION" as const, createdAt: created, firstContactAt: after(7 * MIN) };
    expect(responseTimer(lead, after(60 * MIN))).toEqual({ kind: "met", elapsedMs: 7 * MIN, tone: "amber" });
  });

  it("shows nothing for a lead closed without ever being contacted", () => {
    expect(responseTimer({ status: "LOST", createdAt: created, firstContactAt: null }, after(60 * MIN))).toEqual({ kind: "none" });
  });

  it("never goes negative if the viewer's clock is slightly behind", () => {
    const timer = responseTimer({ status: "NEW", createdAt: created, firstContactAt: null }, after(-2_000));
    expect(timer).toMatchObject({ kind: "running", elapsedMs: 0 });
  });
});

describe("time formats", () => {
  it("formats a running timer as a clock, then hours and days", () => {
    expect(formatRunningTime(3 * MIN + 12_000)).toBe("03:12");
    expect(formatRunningTime(2 * 60 * MIN + 5 * MIN)).toBe("2h 05m");
    expect(formatRunningTime(3 * 24 * 60 * MIN + 4 * 60 * MIN)).toBe("3d 4h");
  });

  it("formats a finished response time", () => {
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(4 * MIN + 12_000)).toBe("4m 12s");
    expect(formatDuration(125 * MIN)).toBe("2h 5m");
  });

  it("formats how long ago a lead arrived", () => {
    expect(formatAgo(20_000)).toBe("just now");
    expect(formatAgo(5 * MIN)).toBe("5 min ago");
    expect(formatAgo(3 * 60 * MIN)).toBe("3 h ago");
    expect(formatAgo(2 * 24 * 60 * MIN)).toBe("2 d ago");
  });
});
