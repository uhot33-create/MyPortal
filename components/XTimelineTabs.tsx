"use client";

import { useEffect, useMemo, useState } from "react";
import XEmbedTimeline from "@/components/XEmbedTimeline";
import type { XTargetSetting } from "@/lib/types";

export function XTimelineTabs({ targets }: { targets: XTargetSetting[] }) {
  const enabled = useMemo(() => targets.filter((x) => x.enabled).sort((a, b) => a.order - b.order), [targets]);
  const [activeId, setActiveId] = useState<string>(enabled[0]?.id ?? "");
  const [loadedIds, setLoadedIds] = useState<string[]>(enabled[0] ? [enabled[0].id] : []);

  useEffect(() => {
    if (!enabled.length) {
      setActiveId("");
      setLoadedIds([]);
      return;
    }

    const hasActive = enabled.some((x) => x.id === activeId);
    if (!hasActive) {
      setActiveId(enabled[0].id);
    }

    const allowed = new Set(enabled.map((x) => x.id));
    setLoadedIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [enabled, activeId]);

  const active = enabled.find((x) => x.id === activeId) ?? enabled[0];

  if (!enabled.length) {
    return <p className="muted">X対象ユーザーが未設定です。設定画面で追加してください。</p>;
  }

  const onSelect = (id: string) => {
    setActiveId(id);
    setLoadedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
          >
            {target.name}
          </button>
        ))}
      </div>

      {enabled.map((target) => {
        const isLoaded = loadedIds.includes(target.id);
        if (!isLoaded) return null;

        return (
          <div key={target.id} style={{ display: target.id === active?.id ? "block" : "none" }}>
            <XEmbedTimeline username={target.username} profileUrl={target.profileUrl} />
          </div>
        );
      })}
    </div>
  );
}