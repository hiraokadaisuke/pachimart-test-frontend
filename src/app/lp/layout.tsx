import type { ReactNode } from "react";

export default function LpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-lg font-semibold text-slate-900">パチマート</div>
          <div className="flex items-center gap-4">
            <a
              href="/listings"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              出品一覧
            </a>
            <a
              href="/signup"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              無料で登録する
            </a>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
