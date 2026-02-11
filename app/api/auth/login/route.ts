import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, isValidCredential } from "@/cupnudle/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { loginId?: string; password?: string };
    const loginId = body.loginId?.trim() ?? "";
    const password = body.password ?? "";

    if (!loginId || !password) {
      return NextResponse.json({ message: "IDとパスワードを入力してください。" }, { status: 400 });
    }

    if (!isValidCredential(loginId, password)) {
      return NextResponse.json({ message: "IDまたはパスワードが一致しません。" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: AUTH_COOKIE_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    return response;
  } catch {
    return NextResponse.json({ message: "ログイン処理に失敗しました。" }, { status: 500 });
  }
}
