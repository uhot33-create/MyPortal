import { NextResponse } from "next/server";
import { getTobaccoCounterSetting, saveTobaccoCounterSetting } from "@/lib/firestoreSettings";
import { requireUser } from "@/lib/auth";

type TobaccoPayload = {
  count: number;
  lastSeenAt: string;
};

function isValidPayload(payload: TobaccoPayload): boolean {
  if (!Number.isFinite(payload.count)) return false;
  if (typeof payload.lastSeenAt !== "string" || !payload.lastSeenAt) return false;
  return !Number.isNaN(new Date(payload.lastSeenAt).getTime());
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

    const body = (await req.json()) as Partial<TobaccoPayload>;
    const payload: TobaccoPayload = {
      count: Number(body.count ?? 0),
      lastSeenAt: String(body.lastSeenAt ?? "")
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

