import { db } from "@/lib/db";

const MAX_LEADS = 3;
const WINDOW_MINUTES = 10;

// Basic spam guard on the public forms: a few requests per phone number per window.
export async function isRateLimited(buyerPhone: string) {
  const recent = await db.lead.count({
    where: { buyerPhone, createdAt: { gte: new Date(Date.now() - WINDOW_MINUTES * 60_000) } },
  });
  return recent >= MAX_LEADS;
}

export const RATE_LIMITED = "rateLimited" as const;
