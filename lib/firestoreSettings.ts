import { getDb } from "@/lib/firebase";
import type {
  NewsKeywordSetting,
  PowerUsageDailySetting,
  PowerUsageMonthlySetting,
  XTargetSetting
} from "@/lib/types";
import { FieldValue, Timestamp, type WriteBatch } from "firebase-admin/firestore";

type NewsInput = Omit<NewsKeywordSetting, "createdAt" | "updatedAt">;
type XInput = Omit<XTargetSetting, "createdAt" | "updatedAt">;
type PowerDailyInput = Omit<PowerUsageDailySetting, "createdAt" | "updatedAt">;
type PowerMonthlyInput = Omit<PowerUsageMonthlySetting, "createdAt" | "updatedAt">;

function toIso(v: unknown): string | undefined {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return undefined;
}

function newsCollection() {
  return getDb().collection("settings").doc("newsKeywords").collection("items");
}

function xCollection() {
  return getDb().collection("settings").doc("xTargets").collection("items");
}

function powerDailyCollection() {
  return getDb().collection("settings").doc("powerUsageDaily").collection("items");
}

function powerMonthlyCollection() {
  return getDb().collection("settings").doc("powerUsageMonthly").collection("items");
}

export async function getNewsSettings(): Promise<NewsKeywordSetting[]> {
  const snap = await newsCollection().orderBy("order", "asc").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      keyword: String(data.keyword ?? ""),
      enabled: Boolean(data.enabled),
      order: Number(data.order ?? 0),
      limit: Number(data.limit ?? 5),
      rssUrl: data.rssUrl ? String(data.rssUrl) : undefined,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt)
    };
  });
}

export async function getXSettings(): Promise<XTargetSetting[]> {
  const snap = await xCollection().orderBy("order", "asc").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: String(data.name ?? ""),
      username: data.username ? String(data.username) : undefined,
      profileUrl: data.profileUrl ? String(data.profileUrl) : undefined,
      enabled: Boolean(data.enabled),
      order: Number(data.order ?? 0),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt)
    };
  });
}

export async function getPowerDailySettings(): Promise<PowerUsageDailySetting[]> {
  const snap = await powerDailyCollection().orderBy("date", "desc").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      date: String(data.date ?? ""),
      powerKwh: Number(data.powerKwh ?? 0),
      costYen: Number(data.costYen ?? 0),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt)
    };
  });
}

export async function getPowerMonthlySettings(): Promise<PowerUsageMonthlySetting[]> {
  const snap = await powerMonthlyCollection().orderBy("month", "desc").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      month: String(data.month ?? ""),
      powerKwh: Number(data.powerKwh ?? 0),
      costYen: Number(data.costYen ?? 0),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt)
    };
  });
}

function writeNews(batch: WriteBatch, items: NewsInput[]) {
  for (const item of items) {
    const ref = newsCollection().doc(item.id);
    batch.set(
      ref,
      {
        keyword: item.keyword,
        enabled: item.enabled,
        order: item.order,
        limit: item.limit,
        rssUrl: item.rssUrl ?? null,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }
}

function writeX(batch: WriteBatch, items: XInput[]) {
  for (const item of items) {
    const ref = xCollection().doc(item.id);
    batch.set(
      ref,
      {
        name: item.name,
        username: item.username ?? null,
        profileUrl: item.profileUrl ?? null,
        enabled: item.enabled,
        order: item.order,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }
}

function writePowerDaily(batch: WriteBatch, items: PowerDailyInput[]) {
  for (const item of items) {
    const ref = powerDailyCollection().doc(item.id);
    batch.set(
      ref,
      {
        date: item.date,
        powerKwh: item.powerKwh,
        costYen: item.costYen,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }
}

function writePowerMonthly(batch: WriteBatch, items: PowerMonthlyInput[]) {
  for (const item of items) {
    const ref = powerMonthlyCollection().doc(item.id);
    batch.set(
      ref,
      {
        month: item.month,
        powerKwh: item.powerKwh,
        costYen: item.costYen,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  }
}

async function deleteMissing(ids: string[], kind: "news" | "x" | "powerDaily" | "powerMonthly", batch: WriteBatch) {
  const snap =
    kind === "news"
      ? await newsCollection().get()
      : kind === "x"
        ? await xCollection().get()
        : kind === "powerDaily"
          ? await powerDailyCollection().get()
          : await powerMonthlyCollection().get();
  const keep = new Set(ids);
  snap.docs.forEach((doc) => {
    if (!keep.has(doc.id)) batch.delete(doc.ref);
  });
}

export async function saveNewsSettings(items: NewsInput[]) {
  const db = getDb();
  const batch = db.batch();
  await deleteMissing(
    items.map((x) => x.id),
    "news",
    batch
  );
  writeNews(batch, items);
  await batch.commit();
}

export async function saveXSettings(items: XInput[]) {
  const db = getDb();
  const batch = db.batch();
  await deleteMissing(
    items.map((x) => x.id),
    "x",
    batch
  );
  writeX(batch, items);
  await batch.commit();
}

export async function savePowerDailySettings(items: PowerDailyInput[]) {
  const db = getDb();
  const batch = db.batch();
  await deleteMissing(
    items.map((x) => x.id),
    "powerDaily",
    batch
  );
  writePowerDaily(batch, items);
  await batch.commit();
}

export async function savePowerMonthlySettings(items: PowerMonthlyInput[]) {
  const db = getDb();
  const batch = db.batch();
  await deleteMissing(
    items.map((x) => x.id),
    "powerMonthly",
    batch
  );
  writePowerMonthly(batch, items);
  await batch.commit();
}
