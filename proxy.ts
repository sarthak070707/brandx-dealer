import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { canAccessPath, isStaffArea } from "@/lib/auth/access";

const chooseLanguage = createIntlMiddleware(routing);

// Public pages get a language prefix (/en, /hi). Staff areas are guarded and stay in English.
// The guard is an optimistic redirect only; every staff query re-checks the role on the server.
export default auth((request) => {
  const { pathname } = request.nextUrl;
  if (!isStaffArea(pathname)) return chooseLanguage(request);

  const role = request.auth?.user.role;
  if (canAccessPath(pathname, role)) return;

  // A signed-in consultant who strays into /admin goes to their inbox; a buyer goes home.
  if (role) return NextResponse.redirect(new URL(role === "BUYER" ? "/" : "/consultant", request.nextUrl));

  const signIn = new URL("/sign-in", request.nextUrl);
  signIn.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signIn);
});

// Everything except the API, Next's own files and static files (anything with a dot).
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
