"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getClientAuth } from "@/lib/firebaseClient";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(getClientAuth(), (user) => {
      setAuthed(Boolean(user));
      setReady(true);
      if (!user) {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return <main className="container">Checking authentication...</main>;
  }

  if (!authed) {
    return null;
  }

  return <>{children}</>;
}
