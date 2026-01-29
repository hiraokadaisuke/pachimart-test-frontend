import Link from "next/link";

export default function PortalHeader() {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-lg font-semibold text-[#2A8FA0]">
            パチマート
          </Link>
          <span className="text-sm font-semibold text-slate-500">/</span>
          <span className="text-sm font-semibold text-slate-900">ポータル</span>
        </div>
        <Link
          href="/lp"
          className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          LPを見る
        </Link>
      </div>
    </header>
  );
}
