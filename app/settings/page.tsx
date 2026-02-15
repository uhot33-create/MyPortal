"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { NavBar } from "@/components/NavBar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { getClientAuth } from "@/lib/firebaseClient";
import type {
  NewsKeywordSetting,
  PowerUsageDailySetting,
  PowerUsageMonthlySetting,
  XTargetSetting
} from "@/lib/types";

type NewsForm = Omit<NewsKeywordSetting, "createdAt" | "updatedAt">;
type XForm = Omit<XTargetSetting, "createdAt" | "updatedAt">;
type PowerDailyForm = Omit<PowerUsageDailySetting, "createdAt" | "updatedAt">;
type PowerMonthlyForm = Omit<PowerUsageMonthlySetting, "createdAt" | "updatedAt">;

function withOrder<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatKwh(value: number) {
  return `${value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} kWh`;
}

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

async function authHeaders(user: User | null): Promise<HeadersInit> {
  if (!user) {
    throw new Error("Login is required");
  }

  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [news, setNews] = useState<NewsForm[]>([]);
  const [xTargets, setXTargets] = useState<XForm[]>([]);
  const [powerDaily, setPowerDaily] = useState<PowerDailyForm[]>([]);
  const [powerMonthly, setPowerMonthly] = useState<PowerMonthlyForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setNews([]);
      setXTargets([]);
      setPowerDaily([]);
      setPowerMonthly([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        const headers = await authHeaders(user);
        const [newsRes, xRes, powerRes] = await Promise.all([
          fetch("/api/settings/news", { cache: "no-store", headers }),
          fetch("/api/settings/x", { cache: "no-store", headers }),
          fetch("/api/settings/power", { cache: "no-store", headers })
        ]);

        if (!newsRes.ok || !xRes.ok || !powerRes.ok) {
          throw new Error("Failed to load settings");
        }

        const newsJson = (await newsRes.json()) as { items: NewsForm[] };
        const xJson = (await xRes.json()) as { items: XForm[] };
        const powerJson = (await powerRes.json()) as { dailyItems: PowerDailyForm[]; monthlyItems: PowerMonthlyForm[] };

        setNews(withOrder(newsJson.items));
        setXTargets(withOrder(xJson.items));
        setPowerDaily(powerJson.dailyItems);
        setPowerMonthly(powerJson.monthlyItems);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authLoading, user]);

  const sortedNews = useMemo(() => [...news].sort((a, b) => a.order - b.order), [news]);
  const sortedX = useMemo(() => [...xTargets].sort((a, b) => a.order - b.order), [xTargets]);
  const sortedPowerDaily = useMemo(() => [...powerDaily].sort((a, b) => b.date.localeCompare(a.date)), [powerDaily]);
  const sortedPowerMonthly = useMemo(() => [...powerMonthly].sort((a, b) => b.month.localeCompare(a.month)), [powerMonthly]);

  const latestDaily = sortedPowerDaily[0];
  const latestMonthly = sortedPowerMonthly[0];

  const addNews = () => {
    setNews((prev) =>
      withOrder([
        ...prev,
        {
          id: crypto.randomUUID(),
          keyword: "",
          enabled: true,
          order: prev.length + 1,
          limit: 5,
          rssUrl: ""
        }
      ])
    );
  };

  const addX = () => {
    setXTargets((prev) =>
      withOrder([
        ...prev,
        {
          id: crypto.randomUUID(),
          name: "",
          username: "",
          profileUrl: "",
          enabled: true,
          order: prev.length + 1
        }
      ])
    );
  };

  const addPowerDaily = () => {
    setPowerDaily((prev) => [{ id: crypto.randomUUID(), date: todayDate(), powerKwh: 0, costYen: 0 }, ...prev]);
  };

  const addPowerMonthly = () => {
    setPowerMonthly((prev) => [{ id: crypto.randomUUID(), month: currentMonth(), powerKwh: 0, costYen: 0 }, ...prev]);
  };

  const move = <T extends { id: string }>(rows: T[], id: string, direction: -1 | 1): T[] => {
    const idx = rows.findIndex((x) => x.id === id);
    if (idx < 0) return rows;
    const next = idx + direction;
    if (next < 0 || next >= rows.length) return rows;
    const clone = [...rows];
    const tmp = clone[idx];
    clone[idx] = clone[next];
    clone[next] = tmp;
    return clone;
  };

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getClientAuth(), provider);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to login");
    }
  };

  const logout = async () => {
    try {
      await signOut(getClientAuth());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to logout");
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const headers = await authHeaders(user);

      const newsPayload = withOrder(
        sortedNews.map((x) => ({ ...x, keyword: x.keyword.trim(), rssUrl: x.rssUrl?.trim() || "" }))
      );
      const xPayload = withOrder(
        sortedX.map((x) => ({
          ...x,
          name: x.name.trim(),
          username: x.username?.trim() || "",
          profileUrl: x.profileUrl?.trim() || ""
        }))
      );
      const dailyPayload = sortedPowerDaily.map((x) => ({
        id: x.id,
        date: x.date,
        powerKwh: Math.max(0, Number(x.powerKwh || 0)),
        costYen: Math.max(0, Number(x.costYen || 0))
      }));
      const monthlyPayload = sortedPowerMonthly.map((x) => ({
        id: x.id,
        month: x.month,
        powerKwh: Math.max(0, Number(x.powerKwh || 0)),
        costYen: Math.max(0, Number(x.costYen || 0))
      }));

      const [newsRes, xRes, powerRes] = await Promise.all([
        fetch("/api/settings/news", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: newsPayload })
        }),
        fetch("/api/settings/x", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: xPayload })
        }),
        fetch("/api/settings/power", {
          method: "POST",
          headers,
          body: JSON.stringify({ dailyItems: dailyPayload, monthlyItems: monthlyPayload })
        })
      ]);

      if (!newsRes.ok || !xRes.ok || !powerRes.ok) {
        const failedRes = [newsRes, xRes, powerRes].find((res) => !res.ok);
        const maybeError = await failedRes?.json().catch(() => null);
        throw new Error(maybeError?.error ?? "Failed to save settings");
      }

      setNews(newsPayload);
      setXTargets(xPayload);
      setPowerDaily(dailyPayload);
      setPowerMonthly(monthlyPayload);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className="container">
        <NavBar current="settings" />
        <section className="card">Checking authentication...</section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <NavBar current="settings" />
        <section className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Theme</h2>
            <ThemeSwitcher />
          </div>
        </section>
        <section className="card">
          <h2>Settings</h2>
          <p className="muted">Please login with Google account.</p>
          <div className="row">
            <button className="primary" type="button" onClick={login}>
              Login with Google
            </button>
            {message ? <span>{message}</span> : null}
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container">
        <NavBar current="settings" />
        <section className="card">Loading...</section>
      </main>
    );
  }

  return (
    <main className="container">
      <NavBar current="settings" />
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Theme</h2>
          <ThemeSwitcher />
        </div>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <div className="row" style={{ alignItems: "center" }}>
            <span className="muted">{user.email}</span>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>PC power usage & electricity cost</h2>
        <p className="muted">Track and manage your daily/monthly consumption history.</p>

        <div className="grid" style={{ marginBottom: 12 }}>
          <div className="item">
            <h3 style={{ marginTop: 0 }}>Latest daily</h3>
            <div className="muted">{latestDaily ? latestDaily.date : "No data"}</div>
            <div>{latestDaily ? formatKwh(latestDaily.powerKwh) : "-"}</div>
            <div>{latestDaily ? formatYen(latestDaily.costYen) : "-"}</div>
          </div>
          <div className="item">
            <h3 style={{ marginTop: 0 }}>Latest monthly</h3>
            <div className="muted">{latestMonthly ? latestMonthly.month : "No data"}</div>
            <div>{latestMonthly ? formatKwh(latestMonthly.powerKwh) : "-"}</div>
            <div>{latestMonthly ? formatYen(latestMonthly.costYen) : "-"}</div>
          </div>
        </div>

        <h3>Daily history</h3>
        <div className="item-list">
          {sortedPowerDaily.map((row) => (
            <div className="item" key={row.id}>
              <div className="grid">
                <label>
                  Date
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => setPowerDaily((prev) => prev.map((x) => (x.id === row.id ? { ...x, date: e.target.value } : x)))}
                  />
                </label>
                <label>
                  Power (kWh)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.powerKwh}
                    onChange={(e) =>
                      setPowerDaily((prev) =>
                        prev.map((x) => (x.id === row.id ? { ...x, powerKwh: Math.max(0, Number(e.target.value || 0)) } : x))
                      )
                    }
                  />
                </label>
                <label>
                  Cost (JPY)
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={row.costYen}
                    onChange={(e) =>
                      setPowerDaily((prev) =>
                        prev.map((x) => (x.id === row.id ? { ...x, costYen: Math.max(0, Number(e.target.value || 0)) } : x))
                      )
                    }
                  />
                </label>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className="danger" onClick={() => setPowerDaily((prev) => prev.filter((x) => x.id !== row.id))}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={addPowerDaily}>
            Add daily record
          </button>
        </div>

        <h3 style={{ marginTop: 20 }}>Monthly history</h3>
        <div className="item-list">
          {sortedPowerMonthly.map((row) => (
            <div className="item" key={row.id}>
              <div className="grid">
                <label>
                  Month
                  <input
                    type="month"
                    value={row.month}
                    onChange={(e) => setPowerMonthly((prev) => prev.map((x) => (x.id === row.id ? { ...x, month: e.target.value } : x)))}
                  />
                </label>
                <label>
                  Power (kWh)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.powerKwh}
                    onChange={(e) =>
                      setPowerMonthly((prev) =>
                        prev.map((x) => (x.id === row.id ? { ...x, powerKwh: Math.max(0, Number(e.target.value || 0)) } : x))
                      )
                    }
                  />
                </label>
                <label>
                  Cost (JPY)
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={row.costYen}
                    onChange={(e) =>
                      setPowerMonthly((prev) =>
                        prev.map((x) => (x.id === row.id ? { ...x, costYen: Math.max(0, Number(e.target.value || 0)) } : x))
                      )
                    }
                  />
                </label>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setPowerMonthly((prev) => prev.filter((x) => x.id !== row.id))}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={addPowerMonthly}>
            Add monthly record
          </button>
        </div>
      </section>

      <section className="card">
        <h2>News keywords</h2>
        <p className="muted">Set per-keyword display limits. Optional RSS URL overrides keyword source.</p>
        <div className="item-list">
          {sortedNews.map((row, index) => (
            <div className="item" key={row.id}>
              <div className="grid">
                <label>
                  Keyword
                  <input
                    value={row.keyword}
                    onChange={(e) => setNews((prev) => prev.map((x) => (x.id === row.id ? { ...x, keyword: e.target.value } : x)))}
                  />
                </label>
                <label>
                  RSS URL (optional)
                  <input
                    value={row.rssUrl ?? ""}
                    onChange={(e) => setNews((prev) => prev.map((x) => (x.id === row.id ? { ...x, rssUrl: e.target.value } : x)))}
                  />
                </label>
                <label>
                  Limit
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={row.limit}
                    onChange={(e) =>
                      setNews((prev) =>
                        prev.map((x) => (x.id === row.id ? { ...x, limit: Math.max(1, Number(e.target.value || 1)) } : x))
                      )
                    }
                  />
                </label>
                <label>
                  Enabled
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => setNews((prev) => prev.map((x) => (x.id === row.id ? { ...x, enabled: e.target.checked } : x)))}
                  />
                </label>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" onClick={() => setNews(withOrder(move(sortedNews, row.id, -1)))} disabled={index === 0}>
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => setNews(withOrder(move(sortedNews, row.id, 1)))}
                  disabled={index === sortedNews.length - 1}
                >
                  Down
                </button>
                <button type="button" className="danger" onClick={() => setNews(withOrder(sortedNews.filter((x) => x.id !== row.id)))}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={addNews}>
            Add keyword
          </button>
        </div>
      </section>

      <section className="card">
        <h2>X targets</h2>
        <p className="muted">Enter either username or profileUrl.</p>
        <div className="item-list">
          {sortedX.map((row, index) => (
            <div className="item" key={row.id}>
              <div className="grid">
                <label>
                  Name
                  <input
                    value={row.name}
                    onChange={(e) => setXTargets((prev) => prev.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x)))}
                  />
                </label>
                <label>
                  Username
                  <input
                    value={row.username ?? ""}
                    onChange={(e) =>
                      setXTargets((prev) => prev.map((x) => (x.id === row.id ? { ...x, username: e.target.value } : x)))
                    }
                  />
                </label>
                <label>
                  Profile URL
                  <input
                    value={row.profileUrl ?? ""}
                    onChange={(e) =>
                      setXTargets((prev) => prev.map((x) => (x.id === row.id ? { ...x, profileUrl: e.target.value } : x)))
                    }
                  />
                </label>
                <label>
                  Enabled
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) =>
                      setXTargets((prev) => prev.map((x) => (x.id === row.id ? { ...x, enabled: e.target.checked } : x)))
                    }
                  />
                </label>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" onClick={() => setXTargets(withOrder(move(sortedX, row.id, -1)))} disabled={index === 0}>
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => setXTargets(withOrder(move(sortedX, row.id, 1)))}
                  disabled={index === sortedX.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setXTargets(withOrder(sortedX.filter((x) => x.id !== row.id)))}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={addX}>
            Add target
          </button>
        </div>
      </section>

      <section className="card">
        <div className="row">
          <button className="primary" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          {message ? <span>{message}</span> : null}
        </div>
      </section>
    </main>
  );
}
