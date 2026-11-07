"use server";

import { optOutPhone, phoneForOptOutToken } from "@/lib/privacy/opt-out";
import { indianMobile } from "@/lib/validation";

// The error is a key into the Errors messages, so the page shows it in the visitor's language.
export type StopState = { done: boolean; error: string | null };

const DONE: StopState = { done: true, error: null };

// The reply is the same whether or not the number has ever enquired, so this page can't be used
// to find out who is in our system.
export async function stopMessages(_previous: StopState, formData: FormData): Promise<StopState> {
  const token = formData.get("token");
  if (typeof token === "string" && token) {
    const phone = await phoneForOptOutToken(token);
    if (!phone) return { done: false, error: "linkInvalid" };
    await optOutPhone(phone);
    return DONE;
  }

  const phone = indianMobile.safeParse(formData.get("phone"));
  if (!phone.success) return { done: false, error: phone.error.issues[0].message };
  await optOutPhone(phone.data);
  return DONE;
}
