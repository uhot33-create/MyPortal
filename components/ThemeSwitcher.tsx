"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "default", label: "Default" },
  { id: "sunset", label: "Sunset" },
  { id: "forest", label: "Forest" },
  { id: "fall", label: "fall" }
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "portal-theme";

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>("default");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((theme) => theme.id === saved)) {
      setActive(saved);
      applyTheme(saved);
      return;
    }

    applyTheme("default");
  }, []);

  const onSelect = (theme: ThemeId) => {
    setActive(theme);
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  };

  return (
    <div className="row" aria-label="theme-switcher">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={active === theme.id ? "theme-active" : ""}
          onClick={() => onSelect(theme.id)}
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}
