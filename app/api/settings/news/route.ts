import { NextResponse } from "next/server";
import { getNewsSettings, saveNewsSettings } from "@/lib/firestoreSettings";

type NewsPayload = {
  id: string;
  keyword: string;
  enabled: boolean;
  order: number;
  limit: number;
  rssUrl?: string;
};

function isValidItem(item: NewsPayload): boolean {
  return Boolean(item.id && typeof item.keyword === "string" && Number.isFinite(item.order) && Number.isFinite(item.limit));
}

export async function GET() {
  try {
    const items = await getNewsSettings();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to fetch news settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: NewsPayload[] };
    const input = Array.isArray(body.items) ? body.items : [];

    if (!input.every(isValidItem)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const sanitized = input.map((item, index) => ({
      id: item.id,
      keyword: item.keyword.trim(),
      enabled: Boolean(item.enabled),
      order: Number.isFinite(item.order) ? item.order : index + 1,
      limit: Math.max(1, Math.min(20, Number(item.limit || 5))),
      rssUrl: item.rssUrl?.trim() || undefined
    }));

    await saveNewsSettings(sanitized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to save news settings" }, { status: 500 });
  }
}
