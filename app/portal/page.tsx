export const dynamic = "force-dynamic";

import { AuthGate } from "@/components/AuthGate";
import { NewsTabs } from "@/components/NewsTabs";
import { PortalCupnudleHeader } from "@/components/PortalCupnudleHeader";
import { XTimelineTabs } from "@/components/XTimelineTabs";
import { getNewsSettings, getXSettings } from "@/lib/firestoreSettings";
import { fetchNewsForKeyword } from "@/lib/rss";

async function fetchUsdJpyRate() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=JPY", {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      date?: string;
      rates?: { JPY?: number };
    };

    const rate = json.rates?.JPY;
    if (typeof rate !== "number") {
      return null;
    }

    return {
      rate,
      date: json.date ?? null
    };
  } catch {
    return null;
  }
}

export default async function PortalPage() {
  const [newsSettings, xTargets, usdJpy] = await Promise.all([getNewsSettings(), getXSettings(), fetchUsdJpyRate()]);

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
            <div className="item" style={{ marginBottom: 12 }}>
              <strong>USD/JPY</strong>
              <div style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: 4 }}>
                {usdJpy ? `${usdJpy.rate.toFixed(2)} 円` : "取得失敗"}
              </div>
              <div className="muted">{usdJpy?.date ? `基準日: ${usdJpy.date}` : "為替レートを取得できませんでした。"}</div>
            </div>
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
