export const dynamic = "force-dynamic";

import { LayoutSwitcher } from "@/components/LayoutSwitcher";
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
    <main className="container portal-page">
      <NavBar current="portal" />
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Display Controls</h2>
          <div className="row">
            <ThemeSwitcher />
            <LayoutSwitcher />
          </div>
        </div>
      </section>

      <section className="card portal-hero-card">
        <div className="portal-hero-banner">
          <div className="portal-hero-block" />
        </div>
        <div className="portal-nav-strip">
          <span>Home</span>
          <span>|</span>
          <span>About</span>
          <span>|</span>
          <span>Works</span>
          <span>|</span>
          <span>Contact</span>
        </div>
      </section>

      <section className="portal-main-grid">
        <article className="card">
          <h2>News</h2>
          <NewsTabs tabs={newsTabs} />
        </article>
        <article className="card">
          <h2>SNS Timeline</h2>
          <XTimelineTabs targets={xTargets} />
        </article>
      </section>
    </main>
  );
}
