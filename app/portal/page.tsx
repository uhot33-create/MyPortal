export const dynamic = "force-dynamic";

import { NavBar } from "@/components/NavBar";
import { NewsTabs } from "@/components/NewsTabs";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { XTimelineTabs } from "@/components/XTimelineTabs";
import { getNewsSettings, getXSettings } from "@/lib/firestoreSettings";
import { fetchNewsForKeyword } from "@/lib/rss";

export default async function PortalPage() {
  const [newsSettings, xTargets] = await Promise.all([getNewsSettings(), getXSettings()]);

  const enabledNews = newsSettings.filter((x) => x.enabled && x.keyword.trim());
  const newsResults = enabledNews.length ? await Promise.all(enabledNews.map((s) => fetchNewsForKeyword(s))) : [];
  const newsTabs = newsResults.map((result) => ({
    keywordId: result.keywordId,
    keyword: result.keyword,
    error: result.error,
    items: result.items.map((item) => ({
      title: item.title,
      link: item.link,
      publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null
    }))
  }));

  return (
    <main className="container">
      <NavBar current="portal" />
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Theme</h2>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="card">
        <h2>News by Keyword</h2>
        <NewsTabs tabs={newsTabs} />
      </section>

      <section className="card">
        <h2>X Embedded Timeline</h2>
        <XTimelineTabs targets={xTargets} />
      </section>
    </main>
  );
}
