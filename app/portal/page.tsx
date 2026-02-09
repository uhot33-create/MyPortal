export const dynamic = "force-dynamic";

import { NavBar } from "@/components/NavBar";
import { XTimelineTabs } from "@/components/XTimelineTabs";
import { getNewsSettings, getXSettings } from "@/lib/firestoreSettings";
import { fetchNewsForKeyword, mergeAndDedupeNews } from "@/lib/rss";

function formatJst(value: Date | null): string {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export default async function PortalPage() {
  const [newsSettings, xTargets] = await Promise.all([getNewsSettings(), getXSettings()]);

  const enabledNews = newsSettings.filter((x) => x.enabled && x.keyword.trim());
  const globalLimit = enabledNews.reduce((sum, cur) => sum + Math.max(1, Number(cur.limit || 5)), 0);

  const newsResults = enabledNews.length ? await Promise.all(enabledNews.map((s) => fetchNewsForKeyword(s))) : [];
  const failures = newsResults.filter((x) => x.error);
  const news = mergeAndDedupeNews(newsResults, globalLimit || 10);

  return (
    <main className="container">
      <NavBar current="portal" />

      <section className="card">
        <h2>News (fetched on render)</h2>
        {!enabledNews.length ? (
          <p className="muted">No news keywords are configured. Please add keywords in Settings.</p>
        ) : null}

        {!!failures.length && (
          <div className="item" style={{ marginBottom: 12 }}>
            <strong>Failed to fetch some keywords</strong>
            <ul>
              {failures.map((f) => (
                <li key={f.keywordId}>
                  {f.keyword}: {f.error}
                </li>
              ))}
            </ul>
            <p className="muted">Please review keyword or RSS URL settings.</p>
          </div>
        )}

        {news.length ? (
          <div className="item-list">
            {news.map((item) => (
              <article className="item" key={item.link}>
                <a href={item.link} target="_blank" rel="noreferrer noopener">
                  {item.title}
                </a>
                <div className="muted">
                  {item.source} / {formatJst(item.publishedAt)}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No articles available. Please review keyword settings.</p>
        )}
      </section>

      <section className="card">
        <h2>X Embedded Timeline</h2>
        <XTimelineTabs targets={xTargets} />
      </section>
    </main>
  );
}