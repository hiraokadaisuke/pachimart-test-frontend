import Link from "next/link";

export default function PortalHeader() {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-lg font-semibold text-[#2A8FA0]">
            パチ管理
          </Link>
          <span className="text-sm font-semibold text-slate-500">/</span>
          <span className="text-sm font-semibold text-slate-900">ポータル</span>
        </div>
      </div>
    </header>
  );
}
