import { NextResponse } from "next/server";
import { getTobaccoCounterSetting, saveTobaccoCounterSetting } from "@/lib/firestoreSettings";
import { requireUser } from "@/lib/auth";

type TobaccoPayload = {
  count: number;
  lastSeenAt: Date;
};

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function isValidPayload(payload: TobaccoPayload): boolean {
  if (!Number.isFinite(payload.count)) return false;
  return !Number.isNaN(payload.lastSeenAt.getTime());
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const item = await getTobaccoCounterSetting();
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to fetch tobacco counter" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { count?: unknown; lastSeenAt?: unknown };
    const lastSeenAt = parseDate(body.lastSeenAt);
    const payload: TobaccoPayload = {
      count: Number(body.count ?? 0),
      lastSeenAt: lastSeenAt ?? new Date(NaN)
    };

    if (!isValidPayload(payload)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    await saveTobaccoCounterSetting(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to save tobacco counter" }, { status: 500 });
  }
}
