"use client";

import { useMemo, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  publishedAt: string | null;
};

type NewsTab = {
  keywordId: string;
  keyword: string;
  error?: string;
  items: NewsItem[];
};

function formatJst(value: string | null): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function NewsTabs({ tabs }: { tabs: NewsTab[] }) {
  const ordered = useMemo(() => tabs, [tabs]);
  const [activeId, setActiveId] = useState<string>(ordered[0]?.keywordId ?? "");
  const active = ordered.find((x) => x.keywordId === activeId) ?? ordered[0];

  if (!ordered.length) {
    return <p className="muted">No news keywords are configured. Please add keywords in Settings.</p>;
  }

  return (
    <div>
      <div className="tabs">
        {ordered.map((tab) => (
          <button
            key={tab.keywordId}
            type="button"
            className={tab.keywordId === active?.keywordId ? "tab-active" : ""}
            onClick={() => setActiveId(tab.keywordId)}
          >
            {tab.keyword}
          </button>
        ))}
      </div>

      {active?.error ? (
        <div className="item" style={{ marginBottom: 12 }}>
          <strong>Failed to fetch this keyword</strong>
          <p className="muted">{active.error}</p>
          <p className="muted">Please review keyword or RSS URL settings.</p>
        </div>
      ) : null}

      {!active?.items.length ? <p className="muted">No articles available for this keyword.</p> : null}

      <div className="item-list">
        {(active?.items ?? []).map((item) => (
          <article className="item" key={item.link}>
            <a href={item.link} target="_blank" rel="noreferrer noopener">
              {item.title}
            </a>
            <div className="muted">{formatJst(item.publishedAt)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
