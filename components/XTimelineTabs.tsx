"use client";

import { useMemo, useState } from "react";
import XEmbedTimeline from "@/components/XEmbedTimeline";
import type { XTargetSetting } from "@/lib/types";

export function XTimelineTabs({ targets }: { targets: XTargetSetting[] }) {
  const enabled = useMemo(() => targets.filter((x) => x.enabled).sort((a, b) => a.order - b.order), [targets]);
  const [activeId, setActiveId] = useState<string>(enabled[0]?.id ?? "");

  const active = enabled.find((x) => x.id === activeId) ?? enabled[0];

  if (!enabled.length) {
    return <p className="muted">X対象ユーザーが未設定です。設定画面で追加してください。</p>;
  }

  return (
    <div>
      <div className="tabs">
        {enabled.map((target) => (
          <button
            key={target.id}
            className={target.id === active?.id ? "tab-active" : ""}
            onClick={() => setActiveId(target.id)}
            type="button"
          >
            {target.name}
          </button>
        ))}
      </div>

      {active ? <XEmbedTimeline key={active.id} username={active.username} profileUrl={active.profileUrl} /> : null}
    </div>
  );
}
