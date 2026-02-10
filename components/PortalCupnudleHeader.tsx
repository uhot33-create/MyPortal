"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { getClientAuth } from "@/lib/firebaseClient";

export function PortalCupnudleHeader({ current }: { current: "portal" | "cupnudle" }) {
  const router = useRouter();

  const logout = async () => {
    await signOut(getClientAuth());
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
