"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { NavBar } from "@/components/NavBar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { getClientAuth } from "@/lib/firebaseClient";
import type { NewsKeywordSetting, XTargetSetting } from "@/lib/types";

type NewsForm = Omit<NewsKeywordSetting, "createdAt" | "updatedAt">;
type XForm = Omit<XTargetSetting, "createdAt" | "updatedAt">;

function withOrder<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
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
      return;
    }

    const load = async () => {
      setLoading(true);
      setMessage("");
      try {
        const headers = await authHeaders(user);
        const [newsRes, xRes] = await Promise.all([
          fetch("/api/settings/news", { cache: "no-store", headers }),
          fetch("/api/settings/x", { cache: "no-store", headers })
        ]);

        if (!newsRes.ok || !xRes.ok) {
          throw new Error("Failed to load settings");
        }

        const newsJson = (await newsRes.json()) as { items: NewsForm[] };
        const xJson = (await xRes.json()) as { items: XForm[] };
        setNews(withOrder(newsJson.items));
        setXTargets(withOrder(xJson.items));
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

      const [newsRes, xRes] = await Promise.all([
        fetch("/api/settings/news", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: newsPayload })
        }),
        fetch("/api/settings/x", {
          method: "POST",
          headers,
          body: JSON.stringify({ items: xPayload })
        })
      ]);

      if (!newsRes.ok || !xRes.ok) {
        const maybeError = await xRes.json().catch(() => null);
        throw new Error(maybeError?.error ?? "Failed to save settings");
      }

      setNews(newsPayload);
      setXTargets(xPayload);
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