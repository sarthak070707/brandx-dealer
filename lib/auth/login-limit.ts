import { createHmac } from "node:crypto";

// Slows down password guessing on the sign-in page. The rules live here, apart from the database, so they
// can be tested on their own.
export const LOGIN_WINDOW_MINUTES = 15;
// Wrong attempts for one email from one visitor's address. It is per address on purpose: a rule that counted
// the email alone would let anyone lock a real user out just by typing wrong passwords for them.
export const MAX_FAILURES_PER_EMAIL_AND_IP = 5;
// Wrong attempts from one address across all emails, which is what trying many accounts looks like.
export const MAX_FAILURES_PER_IP = 20;

const MINUTE_MS = 60_000;

export const loginWindowStart = (now: Date) => new Date(now.getTime() - LOGIN_WINDOW_MINUTES * MINUTE_MS);

export function loginBlocked({ emailAndIp, ip }: { emailAndIp: number; ip: number }) {
  return emailAndIp >= MAX_FAILURES_PER_EMAIL_AND_IP || ip >= MAX_FAILURES_PER_IP;
}

// The visitor's address as the host reports it (Vercel sets x-forwarded-for). With none, everyone shares one
// "unknown" address, which only happens when running on a computer without a proxy in front.
export function clientIp(headers: { get(name: string): string | null }) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

// What is stored in place of an email or an address: a keyed scramble that can be compared but not read back.
export function scramble(value: string, secret: string) {
  return createHmac("sha256", secret).update(value.trim().toLowerCase()).digest("hex");
}
