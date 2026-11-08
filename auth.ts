import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { clearLoginFailures, clientIp, isLoginBlocked, recordLoginFailure } from "@/lib/auth/login-attempts";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

// Thrown instead of checking the password once someone has guessed wrong too often; the sign-in action reads the code.
export const TOO_MANY_ATTEMPTS = "too_many_attempts";
class TooManyAttempts extends CredentialsSignin {
  code = TOO_MANY_ATTEMPTS;
}

async function verifyCredentials(input: unknown, request: Request) {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  const ip = clientIp(request.headers);

  // Checked first and for any email, real or not, so it says nothing about who has an account.
  if (await isLoginBlocked(email, ip)) throw new TooManyAttempts();

  const user = await db.user.findUnique({ where: { email } });
  const passwordMatches = user?.active ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    await recordLoginFailure(email, ip);
    return null;
  }

  await clearLoginFailures(email, ip);
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      authorize: (credentials, request) => verifyCredentials(credentials, request),
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      return session;
    },
  },
});
