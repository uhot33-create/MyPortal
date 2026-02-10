export const dynamic = "force-dynamic";

import { AuthGate } from "@/components/AuthGate";
import { NewsTabs } from "@/components/NewsTabs";
import { PortalCupnudleHeader } from "@/components/PortalCupnudleHeader";
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
    <AuthGate>
      <main className="container portal-page">
        <PortalCupnudleHeader current="portal" />
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
    </AuthGate>
  );
}
