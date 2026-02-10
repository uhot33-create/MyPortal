"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import XEmbedTimeline from "@/components/XEmbedTimeline";
import type { XTargetSetting } from "@/lib/types";

export function XTimelineTabs({ targets }: { targets: XTargetSetting[] }) {
  const enabled = useMemo(() => targets.filter((x) => x.enabled).sort((a, b) => a.order - b.order), [targets]);
  const [activeId, setActiveId] = useState<string>(enabled[0]?.id ?? "");
  const [switchLocked, setSwitchLocked] = useState(false);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled.length) {
      setActiveId("");
      return;
    }

    const hasActive = enabled.some((x) => x.id === activeId);
    if (!hasActive) {
      setActiveId(enabled[0].id);
    }
  }, [enabled, activeId]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const active = enabled.find((x) => x.id === activeId) ?? enabled[0];

  if (!enabled.length) {
    return <p className="muted">X target users are not configured. Please add users in Settings.</p>;
  }

  const onSelect = (id: string) => {
    if (id === activeId || switchLocked) return;

    setActiveId(id);
    setSwitchLocked(true);

    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
    }

    unlockTimerRef.current = setTimeout(() => {
      setSwitchLocked(false);
    }, 1500);
  };

  return (
    <div>
      <div className="tabs">
        {enabled.map((target) => (
          <button
            key={target.id}
            className={target.id === active?.id ? "tab-active" : ""}
            onClick={() => onSelect(target.id)}
            type="button"
            disabled={switchLocked && target.id !== active?.id}
          >
            {target.name}
          </button>
        ))}
      </div>

      {switchLocked ? <p className="muted">Switch cooldown active. Please wait 1.5 seconds.</p> : null}
      {active ? <XEmbedTimeline username={active.username} profileUrl={active.profileUrl} /> : null}
    </div>
  );
}