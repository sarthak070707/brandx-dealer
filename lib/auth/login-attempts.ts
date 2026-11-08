import { db } from "@/lib/db";
import { clientIp, loginBlocked, loginWindowStart, scramble } from "@/lib/auth/login-limit";

export { clientIp };

const KEEP_FOR_MS = 60 * 60_000;

function keysFor(email: string, ip: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return { emailHash: scramble(email, secret), ipHash: scramble(ip, secret) };
}

export async function isLoginBlocked(email: string, ip: string, now = new Date()) {
  const { emailHash, ipHash } = keysFor(email, ip);
  const since = { gte: loginWindowStart(now) };
  const [emailAndIp, fromIp] = await Promise.all([
    db.loginFailure.count({ where: { emailHash, ipHash, createdAt: since } }),
    db.loginFailure.count({ where: { ipHash, createdAt: since } }),
  ]);
  return loginBlocked({ emailAndIp, ip: fromIp });
}

// Each wrong attempt is written down, and the table tidies itself: anything older than an hour can no longer count.
export async function recordLoginFailure(email: string, ip: string, now = new Date()) {
  await db.loginFailure.create({ data: { ...keysFor(email, ip), createdAt: now } });
  await db.loginFailure.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - KEEP_FOR_MS) } } });
}

// A correct password wipes this visitor's earlier mistakes for that email, so a slip or two never builds up.
export async function clearLoginFailures(email: string, ip: string) {
  await db.loginFailure.deleteMany({ where: keysFor(email, ip) });
}
