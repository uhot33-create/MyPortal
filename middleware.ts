import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthenticatedCookieValue } from "@/cupnudle/lib/auth";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/portal") || pathname.startsWith("/cupnudle");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = isAuthenticatedCookieValue(authCookie);

  if (isProtectedPath(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/portal/:path*", "/cupnudle/:path*"]
};
