"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "portal_tobacco_count_state_v1";
const HOUR_MS = 60 * 60 * 1000;

type TobaccoCountState = {
  count: number;
  lastSeenAt: string;
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

function loadState(): TobaccoCountState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TobaccoCountState>;
    if (typeof parsed.count !== "number" || typeof parsed.lastSeenAt !== "string") {
      return null;
    }

    const dt = new Date(parsed.lastSeenAt);
    if (Number.isNaN(dt.getTime())) {
      return null;
    }

    return {
      count: Math.max(0, Math.floor(parsed.count)),
      lastSeenAt: dt.toISOString()
    };
  } catch {
    return null;
  }
}

function saveState(state: TobaccoCountState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function TobaccoCountCard() {
  const currentLabel = "\u73FE\u5728";
  const unitHon = "\u672C";
  const minusAriaLabel = "\u30BF\u30D0\u30B3\u672C\u6570\u30921\u6E1B\u3089\u3059";
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const lastSeenRef = useRef<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    const stored = loadState();

    if (!stored) {
      setCount(0);
      countRef.current = 0;
      lastSeenRef.current = now;
      saveState({ count: 0, lastSeenAt: now.toISOString() });
    } else {
      const from = new Date(stored.lastSeenAt);
      const nextCount = stored.count + calcElapsedAdds(from, now);
      setCount(nextCount);
      countRef.current = nextCount;
      lastSeenRef.current = now;
      saveState({ count: nextCount, lastSeenAt: now.toISOString() });
    }

    const intervalId = window.setInterval(() => {
      const currentLastSeen = lastSeenRef.current;
      if (!currentLastSeen) return;

      const tickNow = new Date();
      const adds = calcElapsedAdds(currentLastSeen, tickNow);
      const updated = countRef.current + adds;
      if (adds > 0) {
        countRef.current = updated;
        setCount(updated);
      }
      lastSeenRef.current = tickNow;
      saveState({ count: countRef.current, lastSeenAt: tickNow.toISOString() });
    }, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const onMinus = () => {
    const now = new Date();
    setCount((prev) => {
      const next = Math.max(0, prev - 1);
      countRef.current = next;
      saveState({ count: next, lastSeenAt: now.toISOString() });
      return next;
    });
    lastSeenRef.current = now;
  };

  return (
    <div className="item tobacco-counter">
      <div>
        <p className="muted tobacco-counter-label">{currentLabel}</p>
        <p className="tobacco-counter-value">
          {count}
          {unitHon}
        </p>
      </div>
      <button type="button" onClick={onMinus} aria-label={minusAriaLabel}>
        -1
      </button>
    </div>
  );
}
