import { describe, expect, it } from "vitest";
import { clientIp, LOGIN_WINDOW_MINUTES, loginBlocked, loginWindowStart, MAX_FAILURES_PER_EMAIL_AND_IP, MAX_FAILURES_PER_IP, scramble } from "./login-limit";

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name] ?? null });

describe("loginBlocked", () => {
  it("lets a visitor make a few mistakes", () => {
    expect(loginBlocked({ emailAndIp: MAX_FAILURES_PER_EMAIL_AND_IP - 1, ip: MAX_FAILURES_PER_IP - 1 })).toBe(false);
    expect(loginBlocked({ emailAndIp: 0, ip: 0 })).toBe(false);
  });

  it("stops one email from one address at the fifth wrong attempt", () => {
    expect(MAX_FAILURES_PER_EMAIL_AND_IP).toBe(5);
    expect(loginBlocked({ emailAndIp: 5, ip: 5 })).toBe(true);
  });

  it("stops an address that has been wrong 20 times across any emails", () => {
    expect(MAX_FAILURES_PER_IP).toBe(20);
    expect(loginBlocked({ emailAndIp: 1, ip: 20 })).toBe(true);
  });
});

describe("loginWindowStart", () => {
  it("looks back fifteen minutes", () => {
    expect(LOGIN_WINDOW_MINUTES).toBe(15);
    expect(loginWindowStart(new Date("2026-11-08T10:30:00Z"))).toEqual(new Date("2026-11-08T10:15:00Z"));
  });
});

describe("clientIp", () => {
  it("takes the first address a proxy reports, tidied", () => {
    expect(clientIp(headers({ "x-forwarded-for": " 203.0.113.9 , 70.41.3.18, 150.172.238.178" }))).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip, then to one shared 'unknown'", () => {
    expect(clientIp(headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(headers({}))).toBe("unknown");
    expect(clientIp(headers({ "x-forwarded-for": "  " }))).toBe("unknown");
  });
});

describe("scramble", () => {
  it("gives the same answer for the same email in any capitals, so attempts add up", () => {
    expect(scramble("Admin@BrandX.example ", "secret")).toBe(scramble("admin@brandx.example", "secret"));
  });

  it("is a different value for a different email or a different secret", () => {
    expect(scramble("a@x.test", "secret")).not.toBe(scramble("b@x.test", "secret"));
    expect(scramble("a@x.test", "secret")).not.toBe(scramble("a@x.test", "other"));
  });

  it("cannot be read back: it holds neither the email nor the address", () => {
    const stored = scramble("admin@brandx.example", "secret");
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).not.toContain("brandx");
    expect(scramble("203.0.113.9", "secret")).not.toContain("203");
  });
});
