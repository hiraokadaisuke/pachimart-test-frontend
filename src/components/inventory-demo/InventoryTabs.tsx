"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/inventory", label: "ダッシュボード" },
  { href: "/inventory/items", label: "在庫一覧" },
  { href: "/inventory/inbound", label: "入庫管理" },
  { href: "/inventory/outbound", label: "出庫管理" },
  { href: "/inventory/stocktakes", label: "棚卸" },
  { href: "/inventory/settings", label: "設定" },
];

export function InventoryTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-3 overflow-x-auto border-b border-slate-200 pb-1">
      <div className="flex min-w-max gap-1.5">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
