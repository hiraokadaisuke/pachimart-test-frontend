import Link from "next/link";

type ModuleHeaderProps = {
  moduleName: string;
};

export default function ModuleHeader({ moduleName }: ModuleHeaderProps) {
  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="text-lg font-semibold text-[#2A8FA0]">
            パチマート
          </Link>
          <span className="text-sm font-semibold text-slate-500">/</span>
          <span className="text-sm font-semibold text-slate-900">{moduleName}</span>
        </div>
        <Link
          href="/portal"
          className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          ポータルへ戻る
        </Link>
      </div>
    </header>
  );
}
