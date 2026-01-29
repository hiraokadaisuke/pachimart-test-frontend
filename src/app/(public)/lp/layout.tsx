import type { ReactNode } from "react";
import Image from "next/image";

export default function LpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FBFD] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <a href="/lp" className="flex items-center gap-3">
            {/* ロゴ画像があるなら差し替え推奨: /public/lp/logo.png 等 */}
            <div className="relative h-10 w-44 sm:h-11 sm:w-52">
              <Image
                src="/lp/logo.png"
                alt="パチマート"
                fill
                className="object-contain"
                priority
              />
            </div>
          </a>

          <nav className="flex items-center gap-4">
            <a
              href="/listings"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              出品一覧
            </a>
            <a
              href="/signup"
              className="rounded-full bg-gradient-to-b from-[#3BB4C6] to-[#2A8FA0] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 transition hover:-translate-y-0.5"
            >
              無料で登録する
            </a>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
