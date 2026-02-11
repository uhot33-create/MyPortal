"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function PortalCupnudleHeader({ current }: { current: "portal" | "cupnudle" }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <section className="card" style={{ display: "grid", gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <strong>My Portal</strong>
        <div className="row">
          <Link href="/portal">
            <button className={current === "portal" ? "primary" : ""}>ポータルへ</button>
          </Link>
          <Link href="/cupnudle">
            <button className={current === "cupnudle" ? "primary" : ""}>cupnudleへ</button>
          </Link>
        </div>
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <ThemeSwitcher />
        <button type="button" onClick={logout}>
          ログアウト
        </button>
      </div>
    </section>
  );
}
