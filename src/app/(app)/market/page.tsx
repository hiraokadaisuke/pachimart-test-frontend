import Link from "next/link";

export default function MarketPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">売買（パチマート）</h1>
      <p className="mt-4 text-sm text-slate-700">
        売買モジュールの入口ページです。現在はLPクローンへ誘導します。
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          パチマートクローンへ移動
        </Link>
      </div>
    </div>
  );
}
