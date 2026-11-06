import { createOptOutToken } from "@/lib/privacy/token";
import { siteUrl } from "@/lib/site";

export function optOutLink(leadId: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return `${siteUrl()}/stop-messages?token=${encodeURIComponent(createOptOutToken(leadId, secret))}`;
}
