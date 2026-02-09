"use client";

import { useEffect, useMemo, useRef } from "react";
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

export default function XEmbedTimeline({ username, profileUrl, height = 600 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const screenName = useMemo(() => resolveUsername(username, profileUrl), [username, profileUrl]);

  useEffect(() => {
    let script = document.querySelector("script[data-x-wjs]") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.setAttribute("data-x-wjs", "1");
      document.body.appendChild(script);
    }

    const mount = async () => {
      if (!screenName || !containerRef.current || initializedRef.current) return;
      initializedRef.current = true;
      containerRef.current.innerHTML = "";

      const create = window.twttr?.widgets?.createTimeline;
      if (create) {
        await create({ sourceType: "profile", screenName }, containerRef.current, {
          height,
          chrome: "nofooter"
        });
        return;
      }

      const anchor = document.createElement("a");
      anchor.className = "twitter-timeline";
      anchor.href = `https://twitter.com/${screenName}`;
      anchor.textContent = `Posts by @${screenName}`;
      containerRef.current.appendChild(anchor);
      window.twttr?.widgets?.load?.(containerRef.current);
    };

    const timer = setTimeout(() => {
      void mount();
    }, 120);

    return () => clearTimeout(timer);
  }, [screenName, height]);

  if (!screenName) {
    return <p className="muted">Xユーザー設定が不正です。username または profileUrl を見直してください。</p>;
  }

  return <div ref={containerRef} />;
}