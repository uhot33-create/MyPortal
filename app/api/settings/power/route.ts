import { NextResponse } from "next/server";
import {
  getPowerDailySettings,
  getPowerMonthlySettings,
  savePowerDailySettings,
  savePowerMonthlySettings
} from "@/lib/firestoreSettings";
import { requireUser } from "@/lib/auth";

type PowerDailyPayload = {
  id: string;
  date: string;
  powerKwh: number;
  costYen: number;
};

type PowerMonthlyPayload = {
  id: string;
  month: string;
  powerKwh: number;
  costYen: number;
};

function isValidDaily(item: PowerDailyPayload): boolean {
  return Boolean(
    item.id &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      Number.isFinite(item.powerKwh) &&
      Number.isFinite(item.costYen)
  );
}

function isValidMonthly(item: PowerMonthlyPayload): boolean {
  return Boolean(
    item.id &&
      typeof item.month === "string" &&
      /^\d{4}-\d{2}$/.test(item.month) &&
      Number.isFinite(item.powerKwh) &&
      Number.isFinite(item.costYen)
  );
}

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const [dailyItems, monthlyItems] = await Promise.all([getPowerDailySettings(), getPowerMonthlySettings()]);
    return NextResponse.json({ dailyItems, monthlyItems });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to fetch power settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { dailyItems?: PowerDailyPayload[]; monthlyItems?: PowerMonthlyPayload[] };
    const dailyInput = Array.isArray(body.dailyItems) ? body.dailyItems : [];
    const monthlyInput = Array.isArray(body.monthlyItems) ? body.monthlyItems : [];

    if (!dailyInput.every(isValidDaily) || !monthlyInput.every(isValidMonthly)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const dailySanitized = dailyInput.map((item) => ({
      id: item.id,
      date: item.date,
      powerKwh: Math.max(0, Number(item.powerKwh)),
      costYen: Math.max(0, Number(item.costYen))
    }));

    const monthlySanitized = monthlyInput.map((item) => ({
      id: item.id,
      month: item.month,
      powerKwh: Math.max(0, Number(item.powerKwh)),
      costYen: Math.max(0, Number(item.costYen))
    }));

    await Promise.all([savePowerDailySettings(dailySanitized), savePowerMonthlySettings(monthlySanitized)]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to save power settings" }, { status: 500 });
  }
}
