import Link from "next/link";

const PORTAL_MODULES = [
  {
    title: "販売管理",
    description: "在庫や売買の実績管理を行います",
    href: "/sales",
  },
  {
    title: "倉庫・在庫",
    description: "倉庫や在庫の管理モジュール",
    href: "/inventory",
  },
  {
    title: "新台代理業",
    description: "新台の代理業務を管理するモジュール",
    href: "/agency",
  },
  {
    title: "経理",
    description: "請求・精算など経理関連の管理",
    href: "/accounting",
  },
  {
    title: "経営指標分析",
    description: "経営指標の分析・レポート",
    href: "/analytics",
  },
] as const;

export default function PortalPage() {
  return (
    <div className="bg-[#F5F8FB]">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900">ポータル</h1>
          <p className="text-sm text-slate-600">各モジュールの入口をまとめています。</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PORTAL_MODULES.map((module) => (
            <div
              key={module.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
                <p className="text-sm text-slate-600">{module.description}</p>
              </div>
              <Link
                href={module.href}
                className="mt-4 inline-flex rounded-md bg-[#0E7490] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#155E75]"
              >
                モジュールを開く
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
