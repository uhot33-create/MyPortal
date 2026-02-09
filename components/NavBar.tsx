import Link from "next/link";

export function NavBar({ current }: { current: "portal" | "settings" }) {
  return (
    <nav className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <strong>My Portal</strong>
      <div className="row">
        <Link href="/portal">
          <button className={current === "portal" ? "primary" : ""}>ポータルへ</button>
        </Link>
        <Link href="/settings">
          <button className={current === "settings" ? "primary" : ""}>設定へ</button>
        </Link>
      </div>
    </nav>
  );
}
