"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { z } from "zod";
import { signIn, signOut, TOO_MANY_ATTEMPTS } from "@/auth";

// The error is a key into the Errors messages, so the page shows it in the visitor's language.
export type SignInState = { error: string | null };

const credentialsSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
  // Only a path on this site, never an address elsewhere.
  redirectTo: z.string().regex(/^\/(?!\/)/).catch("/consultant"),
});

export async function signInWithPassword(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") || "/consultant",
  });
  if (!credentials.success) return { error: "credentialsMissing" };

  try {
    // Buyers who land on /consultant are sent home by the proxy, so one default fits everyone.
    await signIn("credentials", credentials.data);
    return { error: null };
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === TOO_MANY_ATTEMPTS) return { error: "tooManySignIns" };
    if (error instanceof AuthError) return { error: "credentialsWrong" };
    throw error;
  }
}

export async function signOutOfBrandX() {
  await signOut({ redirectTo: "/" });
}
