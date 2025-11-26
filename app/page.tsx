import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">ようこそ！</h1>
        <p className="mt-3 text-lg text-slate-600">
          Next.js（App Router）と Tailwind CSS を使ったサンプルプロジェクトです。
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            href="/items"
          >
            アイテム一覧を見る
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">App Router + TypeScript</h2>
          <p className="mt-2 text-sm text-slate-600">
            app ディレクトリ構成で、型安全な Next.js プロジェクトをすぐに始められます。
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Tailwind CSS</h2>
          <p className="mt-2 text-sm text-slate-600">
            ユーティリティファーストなスタイルで、デザインをすばやく整えています。
          </p>
        </div>
      </section>
    </div>
  );
}
