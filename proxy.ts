import { auth } from "./lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server"
import {  AUTH_ROUTES, GUEST_ONLY_ROUTES, PROTECTED_ROUTES, } from "./features/auth/lib/route";
import { appUrl } from "./lib/app-url";


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isProtected = PROTECTED_ROUTES.includes(pathname);
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

  if (isProtected && !session) {
    return NextResponse.redirect(appUrl(AUTH_ROUTES.signIn));
  }

  if (isGuestOnly && session) {
    return NextResponse.redirect(appUrl(AUTH_ROUTES.home));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in"],
};
