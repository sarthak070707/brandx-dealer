import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessPath } from "@/lib/auth/access";

// Optimistic redirect only; every staff query re-checks the role on the server.
export default auth((request) => {
  const role = request.auth?.user.role;
  if (canAccessPath(request.nextUrl.pathname, role)) return;

  if (role) return NextResponse.redirect(new URL("/", request.nextUrl));

  const signIn = new URL("/sign-in", request.nextUrl);
  signIn.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: ["/admin/:path*", "/consultant/:path*"],
};
