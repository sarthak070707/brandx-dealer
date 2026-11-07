import type { Language } from "@/generated/prisma/enums";
import { createOptOutToken } from "@/lib/privacy/token";
import { siteUrl } from "@/lib/site";

// The page opens in the language the buyer chose for their messages.
export function optOutLink(leadId: string, language: Language) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return `${siteUrl()}/${language === "HI" ? "hi" : "en"}/stop-messages?token=${encodeURIComponent(createOptOutToken(leadId, secret))}`;
}
