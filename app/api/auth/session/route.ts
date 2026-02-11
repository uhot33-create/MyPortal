import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isAuthenticatedCookieValue } from "@/cupnudle/lib/auth";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.split("=")[1];

  return NextResponse.json({ authenticated: isAuthenticatedCookieValue(token) });
}
