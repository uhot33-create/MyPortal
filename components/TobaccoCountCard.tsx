"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebaseClient";

const HOUR_MS = 60 * 60 * 1000;

type TobaccoCounterApiItem = {
  count?: number;
  lastSeenAt?: string;
};

function isPauseHour(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 23 || hour < 5;
}

function calcElapsedAdds(from: Date, to: Date): number {
  if (to.getTime() <= from.getTime()) return 0;

  let cursorMs = from.getTime() + HOUR_MS;
  let adds = 0;
  while (cursorMs <= to.getTime()) {
    const point = new Date(cursorMs);
    if (!isPauseHour(point)) {
      adds += 1;
    }
    cursorMs += HOUR_MS;
  }
  return adds;
}

async function authHeaders(user: User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function loadCounter(user: User): Promise<{ count: number; lastSeenAt?: string }> {
  const headers = await authHeaders(user);
  const response = await fetch("/api/settings/tobacco", {
    cache: "no-store",
    headers
  });

  if (!response.ok) {
    throw new Error("failed to load tobacco counter");
  }

  const json = (await response.json()) as { item?: TobaccoCounterApiItem };
  const item = json.item ?? {};
  return {
    count: Number.isFinite(item.count) ? Math.max(0, Math.floor(Number(item.count))) : 0,
    lastSeenAt: typeof item.lastSeenAt === "string" ? item.lastSeenAt : undefined
  };
}

async function saveCounter(user: User, count: number, lastSeenAt: string): Promise<void> {
  const headers = await authHeaders(user);
  const response = await fetch("/api/settings/tobacco", {
    method: "POST",
    headers,
    body: JSON.stringify({ count, lastSeenAt })
  });

  if (!response.ok) {
    throw new Error("failed to save tobacco counter");
  }
}

export function TobaccoCountCard() {
  const currentLabel = "\u73FE\u5728";
  const unitHon = "\u672C";
  const minusAriaLabel = "\u30BF\u30D0\u30B3\u672C\u6570\u30921\u6E1B\u3089\u3059";
  const loginMessage = "\u30ED\u30B0\u30A4\u30F3\u5F8C\u306B\u30AB\u30A6\u30F3\u30BF\u30FC\u3092\u5229\u7528\u3067\u304D\u307E\u3059\u3002";
  const saveErrorMessage = "\u30AB\u30A6\u30F3\u30BF\u30FC\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002";

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const userRef = useRef<User | null>(null);
  const countRef = useRef(0);
  const lastSeenRef = useRef<Date | null>(null);

  useEffect(() => {
    const auth = getClientAuth();
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startInterval = (user: User) => {
      stopInterval();
      intervalId = setInterval(() => {
        const from = lastSeenRef.current;
        if (!from) return;

        const now = new Date();
        const adds = calcElapsedAdds(from, now);
        if (adds <= 0) return;

        const next = countRef.current + adds;
        countRef.current = next;
        lastSeenRef.current = now;
        setCount(next);

        void saveCounter(user, next, now.toISOString()).catch(() => {
          setMessage(saveErrorMessage);
        });
      }, 60 * 1000);
    };

    const initializeForUser = async (user: User | null) => {
      stopInterval();

      if (!active) return;

      if (!user) {
        userRef.current = null;
        countRef.current = 0;
        lastSeenRef.current = null;
        setCount(0);
        setMessage(loginMessage);
        setLoading(false);
        return;
      }

      userRef.current = user;
      setLoading(true);
      setMessage("");

      try {
        const stored = await loadCounter(user);
        if (!active) return;

        const now = new Date();
        const from = stored.lastSeenAt ? new Date(stored.lastSeenAt) : now;
        const base = Math.max(0, stored.count);
        const next = base + (Number.isNaN(from.getTime()) ? 0 : calcElapsedAdds(from, now));

        countRef.current = next;
        lastSeenRef.current = now;
        setCount(next);

        await saveCounter(user, next, now.toISOString());
        if (!active) return;

        setMessage("");
        startInterval(user);
      } catch {
        if (!active) return;

        const now = new Date();
        countRef.current = 0;
        lastSeenRef.current = now;
        setCount(0);
        setMessage(saveErrorMessage);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void initializeForUser(user);
    });

    return () => {
      active = false;
      stopInterval();
      unsubscribe();
    };
  }, []);

  const onMinus = () => {
    const user = userRef.current;
    if (!user) return;

    const now = new Date();
    const next = Math.max(0, countRef.current - 1);

    countRef.current = next;
    lastSeenRef.current = now;
    setCount(next);

    void saveCounter(user, next, now.toISOString()).then(() => {
      setMessage("");
    }).catch(() => {
      setMessage(saveErrorMessage);
    });
  };

  if (loading) {
    return <p className="muted">Loading...</p>;
  }

  return (
    <div>
      <div className="item tobacco-counter">
        <div>
          <p className="muted tobacco-counter-label">{currentLabel}</p>
          <p className="tobacco-counter-value">
            {count}
            {unitHon}
          </p>
        </div>
        <button type="button" onClick={onMinus} aria-label={minusAriaLabel} disabled={!userRef.current}>
          -1
        </button>
      </div>
      {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
    </div>
  );
}
