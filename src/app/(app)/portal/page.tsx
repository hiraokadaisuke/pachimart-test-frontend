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
    <div className="flex min-h-screen bg-[#f6f8fb] px-4 py-6">
      <div className="w-full max-w-6xl">
        <header className="mb-4">
          <h1 className="text-lg font-bold text-slate-800">パチ管理</h1>
        </header>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {PORTAL_MODULES.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                href={module.href}
                key={module.title}
                className="group block cursor-pointer rounded border border-slate-300 bg-white p-3 hover:bg-slate-50"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-slate-700" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-slate-900">{module.title}</h2>
                  </div>
                  <p className="text-xs text-slate-600">{module.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
