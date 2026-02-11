"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as { authenticated?: boolean };
      setAuthenticated(Boolean(json.authenticated));
    };
    void load();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password })
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { message?: string } | null;
        setMessage(json?.message ?? "ログインに失敗しました。");
        return;
      }

      setAuthenticated(true);
      router.push("/portal");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setLoginId("");
    setPassword("");
  };

  return (
    <main className="container">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>ログイン</h1>

        {!authenticated ? (
          <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>ID</span>
              <input value={loginId} onChange={(e) => setLoginId(e.target.value)} required disabled={submitting} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>パスワード</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </label>

            <div className="row">
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? "認証中..." : "ログイン"}
              </button>
              {message ? <span>{message}</span> : null}
            </div>
          </form>
        ) : (
          <div className="row" style={{ marginTop: 12 }}>
            <Link href="/portal">
              <button className="primary">ポータルへ</button>
            </Link>
            <Link href="/cupnudle">
              <button className="primary">cupnudleへ</button>
            </Link>
            <button type="button" onClick={logout}>
              ログアウト
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
