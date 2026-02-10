import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { PortalCupnudleHeader } from "@/components/PortalCupnudleHeader";
import StockList from "@/cupnudle/components/stocks/StockList";

export default function HomePage() {
  return (
    <AuthGate>
      <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4">
        <section className="mx-auto mb-4 w-full max-w-2xl">
          <PortalCupnudleHeader current="cupnudle" />
        </section>

        <header className="mx-auto mb-4 w-full max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900">在庫一覧</h1>
          <p className="mt-1 text-sm text-slate-600">有効期限が近い在庫を優先して管理できます。</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/cupnudle/stocks/new"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            >
              在庫を追加
            </Link>
            <Link
              href="/cupnudle/items"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              品名を管理
            </Link>
          </div>
        </header>

        <StockList />
      </main>
    </AuthGate>
  );
}
