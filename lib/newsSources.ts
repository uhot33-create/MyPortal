export function buildGoogleNewsRssUrl(keyword: string): string {
  const q = encodeURIComponent(keyword.trim());
  return `https://news.google.com/rss/search?q=${q}&hl=ja&gl=JP&ceid=JP:ja`;
}

export function normalizeXUsername(input: string): string {
  return input.replace(/^@/, "").trim();
}

export function usernameFromProfileUrl(profileUrl: string): string | null {
  try {
    const url = new URL(profileUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] ? normalizeXUsername(parts[0]) : null;
  } catch {
    return null;
  }
}
