import { createHmac, timingSafeEqual } from "node:crypto";

// An opt-out link carries the lead's id and a signature made with the server's secret, so a
// buyer can stop their own messages with one tap and nobody can forge a link for someone else.
const sign = (leadId: string, secret: string) => createHmac("sha256", secret).update(`opt-out:${leadId}`).digest("base64url");

export const createOptOutToken = (leadId: string, secret: string) => `${leadId}.${sign(leadId, secret)}`;

export function readOptOutToken(token: string, secret: string) {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const leadId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(leadId, secret));
  return given.length === expected.length && timingSafeEqual(given, expected) ? leadId : null;
}
