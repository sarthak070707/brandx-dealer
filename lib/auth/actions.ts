"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type SignInState = { error: string | null };

export async function signInWithPassword(_previous: SignInState, formData: FormData): Promise<SignInState> {
  try {
    // Buyers who land on /consultant are sent home by the proxy, so one default fits everyone.
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: String(formData.get("redirectTo") || "/consultant"),
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) return { error: "That email and password don't match." };
    throw error;
  }
}

export async function signOutOfBrandX() {
  await signOut({ redirectTo: "/" });
}
