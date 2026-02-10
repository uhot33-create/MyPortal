"use client";

import { useEffect, useState } from "react";

const LAYOUTS = [
  { id: "layout-a", label: "Layout A" },
  { id: "layout-b", label: "Layout B" }
] as const;

type LayoutId = (typeof LAYOUTS)[number]["id"];

const STORAGE_KEY = "portal-layout";

function applyLayout(layout: LayoutId) {
  document.documentElement.setAttribute("data-layout", layout);
}

export function LayoutSwitcher() {
  const [active, setActive] = useState<LayoutId>("layout-a");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LayoutId | null;
    if (saved && LAYOUTS.some((layout) => layout.id === saved)) {
      setActive(saved);
      applyLayout(saved);
      return;
    }
    applyLayout("layout-a");
  }, []);

  const onSelect = (layout: LayoutId) => {
    setActive(layout);
    applyLayout(layout);
    localStorage.setItem(STORAGE_KEY, layout);
  };

  return (
    <div className="row" aria-label="layout-switcher">
      {LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          type="button"
          className={active === layout.id ? "theme-active" : ""}
          onClick={() => onSelect(layout.id)}
        >
          {layout.label}
        </button>
      ))}
    </div>
  );
}
