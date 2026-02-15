export type NewsKeywordSetting = {
  id: string;
  keyword: string;
  enabled: boolean;
  order: number;
  limit: number;
  rssUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type XTargetSetting = {
  id: string;
  name: string;
  username?: string;
  profileUrl?: string;
  enabled: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PowerUsageDailySetting = {
  id: string;
  date: string;
  powerKwh: number;
  costYen: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PowerUsageMonthlySetting = {
  id: string;
  month: string;
  powerKwh: number;
  costYen: number;
  createdAt?: string;
  updatedAt?: string;
};

export type RssArticle = {
  title: string;
  link: string;
  publishedAt: Date | null;
  source: string;
};
