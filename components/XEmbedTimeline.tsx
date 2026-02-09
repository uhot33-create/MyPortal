"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeXUsername, usernameFromProfileUrl } from "@/lib/newsSources";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        createTimeline?: (
          source: { sourceType: "profile"; screenName: string },
          element: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<unknown>;
        load?: (element?: HTMLElement) => void;
      };
    };
  }
}

type Props = {
  username?: string;
  profileUrl?: string;
  height?: number;
};

function resolveUsername(username?: string, profileUrl?: string): string | null {
  if (username?.trim()) return normalizeXUsername(username);
  if (profileUrl?.trim()) return usernameFromProfileUrl(profileUrl.trim());
  return null;
}

function waitForIframe(element: HTMLElement, timeoutMs: number): Promise<boolean> {
  const started = Date.now();

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const hasIframe = Boolean(element.querySelector("iframe"));
      if (hasIframe) {
        clearInterval(timer);
        resolve(true);
        return;
      }

      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        resolve(false);
      }
    }, 200);
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export default function XEmbedTimeline({ username, profileUrl, height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScreenNameRef = useRef<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenName = useMemo(() => resolveUsername(username, profileUrl), [username, profileUrl]);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const changedUser = previousScreenNameRef.current !== screenName;
    if (changedUser) {
      previousScreenNameRef.current = screenName;
      setStatus("idle");
      setAttempt(0);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }
  }, [screenName]);

  useEffect(() => {
    if (!screenName || !containerRef.current) return;

    let cancelled = false;

    const mount = async () => {
      setStatus("loading");

      let script = document.querySelector("script[data-x-wjs]") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.setAttribute("data-x-wjs", "1");
        document.body.appendChild(script);
      }

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = "";

      try {
        const create = window.twttr?.widgets?.createTimeline;

        if (create) {
          await withTimeout(
            create({ sourceType: "profile", screenName }, container, {
              height,
              chrome: "nofooter"
            }),
            10000,
            "timeline_create_timeout"
          );
        } else {
          const anchor = document.createElement("a");
          anchor.className = "twitter-timeline";
          anchor.href = `https://twitter.com/${screenName}`;
          anchor.textContent = `Posts by @${screenName}`;
          container.appendChild(anchor);
          window.twttr?.widgets?.load?.(container);
        }

        const loaded = await waitForIframe(container, 8000);
        if (cancelled) return;

        if (loaded) {
          setStatus("ready");
          return;
        }

        throw new Error("timeline_not_loaded");
      } catch {
        if (cancelled) return;
        setStatus("error");

        // Auto retry once to absorb temporary 429 responses.
        if (attempt === 0) {
          retryTimerRef.current = setTimeout(() => {
            setAttempt(1);
          }, 3000);
        }
      }
    };

    void mount();

    return () => {
      cancelled = true;
    };
  }, [screenName, height, attempt]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  if (!screenName) {
    return <p className="muted">X user setting is invalid. Please review username or profileUrl.</p>;
  }

  return (
    <div>
      {status === "loading" ? <p className="muted">Loading X timeline...</p> : null}
      {status === "error" ? (
        <div className="item" style={{ marginBottom: 8 }}>
          <p className="muted">Failed to load X timeline. This may be caused by temporary 429 limits.</p>
          <div className="row">
            <button type="button" onClick={() => setAttempt((prev) => prev + 1)}>
              Retry
            </button>
            <a href={`https://x.com/${screenName}`} target="_blank" rel="noreferrer noopener">
              Open on X
            </a>
          </div>
        </div>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}