"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { getClientAuth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(getClientAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      setMessage("");
      router.push("/portal");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
    }
  };

  const logout = async () => {
    await signOut(getClientAuth());
    setMessage("");
  };

  if (loading) {
    return <main className="container">Checking authentication...</main>;
  }

  return (
    <main className="container">
      <section className="card">
        <h1>ログイン</h1>
        {!user ? <p className="muted">Googleアカウントでログインしてください。</p> : null}
        <div className="row" style={{ marginTop: 12 }}>
          {!user ? (
            <button className="primary" type="button" onClick={login}>
              Login with Google
            </button>
          ) : (
            <>
              <Link href="/portal">
                <button className="primary">ポータルへ</button>
              </Link>
              <Link href="/cupnudle">
                <button className="primary">cupnudleへ</button>
              </Link>
              <button type="button" onClick={logout}>
                ログアウト
              </button>
            </>
          )}
          {message ? <span>{message}</span> : null}
        </div>
      </section>
    </main>
  );
}
