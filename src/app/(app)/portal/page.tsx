import Link from "next/link";
import { Boxes, ClipboardList } from "lucide-react";

const PORTAL_MODULES = [
  {
    title: "販売管理",
    description: "売買の実績管理を行います",
    href: "/sales",
    icon: ClipboardList,
  },
  {
    title: "倉庫・在庫",
    description: "在庫管理や倉庫での入出庫管理を行います",
    href: "/inventory",
    icon: Boxes,
  },
] as const;

export default function PortalPage() {
  return (
    <div className="flex min-h-screen justify-center bg-[#F5F8FB] px-6 py-14 md:py-20">
      <div className="w-full max-w-5xl">
        <header className="mb-8 md:mb-12">
          <h1 className="text-2xl font-bold tracking-tight text-[#2A8FA0] md:text-3xl">パチ管理</h1>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {PORTAL_MODULES.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                href={module.href}
                key={module.title}
                className="group block cursor-pointer rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0E7490] hover:shadow-lg md:min-h-[180px] md:p-10"
              >
                <div className="flex min-h-[160px] flex-col justify-between md:min-h-0">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-slate-700" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-slate-900">{module.title}</h2>
                  </div>
                  <p className="mt-5 text-base leading-relaxed text-slate-600">{module.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
