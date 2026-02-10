import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthenticatedCookieValue } from "@/cupnudle/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/cupnudle")) {
    return NextResponse.next();
  }

  const isLoginPath = pathname === "/cupnudle/login" || pathname.startsWith("/cupnudle/login/");
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = isAuthenticatedCookieValue(authCookie);

  if (!isLoginPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/cupnudle/login", request.url));
  }

  if (isLoginPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/cupnudle", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cupnudle/:path*"],
};
