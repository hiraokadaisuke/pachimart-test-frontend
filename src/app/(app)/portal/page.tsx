import Link from "next/link";

const PORTAL_MODULES = [
  {
    title: "販売管理",
    description: "売買の実績管理を行います",
    href: "/sales",
  },
  {
    title: "倉庫・在庫",
    description: "在庫管理や倉庫での入庫出庫を行います",
    href: "/inventory",
  },
] as const;

export default function PortalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FB] px-6 py-14">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PORTAL_MODULES.map((module) => (
            <Link
              href={module.href}
              key={module.title}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0E7490] hover:shadow-xl"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900">{module.title}</h2>
                <p className="text-sm text-slate-600">{module.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
