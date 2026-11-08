import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/auth/login-attempts";
import { scramble } from "@/lib/auth/login-limit";
import { db } from "@/lib/db";

// Needs a database. It writes a few rows for made-up emails and addresses and removes them afterwards.
const EMAILS = ["limit-one@example.test", "limit-two@example.test"];
const IPS = ["203.0.113.10", "203.0.113.11", "203.0.113.12"];
const MINUTE = 60_000;

const secret = () => process.env.NEXTAUTH_SECRET ?? "";
const failMany = async (email: string, ip: string, times: number, at = new Date()) => {
  for (let count = 0; count < times; count += 1) await recordLoginFailure(email, ip, at);
};

async function removeTestRows() {
  await db.loginFailure.deleteMany({
    where: { OR: [{ emailHash: { in: EMAILS.map((email) => scramble(email, secret())) } }, { ipHash: { in: IPS.map((ip) => scramble(ip, secret())) } }] },
  });
}

beforeAll(async () => {
  if (!secret()) throw new Error("NEXTAUTH_SECRET must be set to run this test.");
  await removeTestRows();
});
afterAll(removeTestRows);

describe("the sign-in limit, against the database", () => {
  it("lets a visitor try four times and stops them at the fifth wrong attempt", async () => {
    await failMany(EMAILS[0], IPS[0], 4);
    expect(await isLoginBlocked(EMAILS[0], IPS[0])).toBe(false);
    await failMany(EMAILS[0], IPS[0], 1);
    expect(await isLoginBlocked(EMAILS[0], IPS[0])).toBe(true);
  });

  it("does not let one visitor lock an email out for anyone else", async () => {
    expect(await isLoginBlocked(EMAILS[0], IPS[1])).toBe(false);
  });

  it("does not hold a visitor's mistakes against a different email of theirs, until it adds up to 20", async () => {
    expect(await isLoginBlocked(EMAILS[1], IPS[0])).toBe(false);
  });

  it("stops an address that has been wrong 20 times in all, whichever emails it tried", async () => {
    await failMany(EMAILS[0], IPS[2], 4);
    await failMany(EMAILS[1], IPS[2], 4);
    expect(await isLoginBlocked("limit-three@example.test", IPS[2])).toBe(false);
    await failMany(EMAILS[0], IPS[2], 0);
    for (let index = 0; index < 12; index += 1) await recordLoginFailure(`spray-${index}@example.test`, IPS[2]);
    expect(await isLoginBlocked("limit-three@example.test", IPS[2])).toBe(true);
    await db.loginFailure.deleteMany({ where: { ipHash: scramble(IPS[2], secret()) } });
  });

  it("forgets mistakes after fifteen minutes", async () => {
    await removeTestRows();
    await failMany(EMAILS[0], IPS[0], 5, new Date(Date.now() - 16 * MINUTE));
    expect(await isLoginBlocked(EMAILS[0], IPS[0])).toBe(false);
  });

  it("clears a visitor's mistakes for an email when they get the password right", async () => {
    await removeTestRows();
    await failMany(EMAILS[0], IPS[0], 4);
    await clearLoginFailures(EMAILS[0], IPS[0]);
    await failMany(EMAILS[0], IPS[0], 4);
    expect(await isLoginBlocked(EMAILS[0], IPS[0])).toBe(false);
  });

  it("stores only scrambled values, never the email or the address", async () => {
    await removeTestRows();
    await failMany(EMAILS[0], IPS[0], 1);
    const [row] = await db.loginFailure.findMany({ where: { emailHash: scramble(EMAILS[0], secret()) } });
    expect(JSON.stringify(row)).not.toContain("limit-one");
    expect(JSON.stringify(row)).not.toContain("203.0.113");
  });

  it("tidies away rows older than an hour when it records a new one", async () => {
    await removeTestRows();
    await failMany(EMAILS[1], IPS[1], 1, new Date(Date.now() - 2 * 60 * MINUTE));
    await failMany(EMAILS[1], IPS[1], 1);
    expect(await db.loginFailure.count({ where: { emailHash: scramble(EMAILS[1], secret()) } })).toBe(1);
  });
});
