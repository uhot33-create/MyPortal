import { NextResponse } from "next/server";
import { getXSettings, saveXSettings } from "@/lib/firestoreSettings";

type XPayload = {
  id: string;
  name: string;
  username?: string;
  profileUrl?: string;
  enabled: boolean;
  order: number;
};

function isValidItem(item: XPayload): boolean {
  return Boolean(item.id && typeof item.name === "string" && Number.isFinite(item.order));
}

export async function GET() {
  try {
    const items = await getXSettings();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to fetch x settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: XPayload[] };
    const input = Array.isArray(body.items) ? body.items : [];

    if (!input.every(isValidItem)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const sanitized = input.map((item, index) => ({
      id: item.id,
      name: item.name.trim(),
      username: item.username?.trim() || undefined,
      profileUrl: item.profileUrl?.trim() || undefined,
      enabled: Boolean(item.enabled),
      order: Number.isFinite(item.order) ? item.order : index + 1
    }));

    for (const item of sanitized) {
      if (!item.name || (!item.username && !item.profileUrl)) {
        return NextResponse.json({ error: "name and username/profileUrl are required" }, { status: 400 });
      }
    }

    await saveXSettings(sanitized);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to save x settings" }, { status: 500 });
  }
}
