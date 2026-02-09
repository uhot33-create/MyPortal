import { XMLParser } from "fast-xml-parser";
import { buildGoogleNewsRssUrl } from "@/lib/newsSources";
import type { NewsKeywordSetting, RssArticle } from "@/lib/types";

type FetchResult = {
  keywordId: string;
  keyword: string;
  items: RssArticle[];
  error?: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

function parseDate(input: unknown): Date | null {
  if (typeof input !== "string") return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function itemLink(raw: any): string {
  if (!raw) return "";
  if (typeof raw.link === "string") return raw.link;
  if (raw.link?.["@_href"]) return raw.link["@_href"];
  if (Array.isArray(raw.link)) {
    const withHref = raw.link.find((x: any) => x?.["@_href"]);
    if (withHref?.["@_href"]) return withHref["@_href"];
  }
  return "";
}

function parseRssXml(xml: string, source: string): RssArticle[] {
  const parsed = parser.parse(xml);
  const rssItems = parsed?.rss?.channel?.item;
  if (rssItems) {
    const rows = Array.isArray(rssItems) ? rssItems : [rssItems];
    return rows
      .map((row: any) => ({
        title: String(row.title ?? "(no title)"),
        link: itemLink(row),
        publishedAt: parseDate(row.pubDate),
        source
      }))
      .filter((v: RssArticle) => v.link);
  }

  const atomEntries = parsed?.feed?.entry;
  if (atomEntries) {
    const rows = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
    return rows
      .map((row: any) => ({
        title: String(row.title ?? "(no title)"),
        link: itemLink(row),
        publishedAt: parseDate(row.updated ?? row.published),
        source
      }))
      .filter((v: RssArticle) => v.link);
  }

  return [];
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "MyPortal/1.0"
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchNewsForKeyword(setting: NewsKeywordSetting): Promise<FetchResult> {
  const url = setting.rssUrl?.trim() || buildGoogleNewsRssUrl(setting.keyword);

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) {
      return {
        keywordId: setting.id,
        keyword: setting.keyword,
        items: [],
        error: `HTTP ${res.status}`
      };
    }

    const xml = await res.text();
    const parsed = parseRssXml(xml, setting.keyword);
    const limit = Math.max(1, Number(setting.limit || 5));
    return {
      keywordId: setting.id,
      keyword: setting.keyword,
      items: parsed
        .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
        .slice(0, limit)
    };
  } catch (error) {
    return {
      keywordId: setting.id,
      keyword: setting.keyword,
      items: [],
      error: error instanceof Error ? error.message : "fetch failed"
    };
  }
}

export function mergeAndDedupeNews(results: FetchResult[], globalLimit: number): RssArticle[] {
  const map = new Map<string, RssArticle>();

  for (const result of results) {
    for (const item of result.items) {
      if (!map.has(item.link)) {
        map.set(item.link, item);
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .slice(0, Math.max(1, globalLimit));
}

export type { FetchResult };
