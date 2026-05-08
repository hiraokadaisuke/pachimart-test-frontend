"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/inventory", label: "ダッシュボード" },
  { href: "/inventory/items", label: "在庫一覧" },
  { href: "/inventory/inbound", label: "入庫予定" },
  { href: "/inventory/outbound", label: "出庫予定" },
  { href: "/inventory/stocktakes", label: "棚卸" },
  { href: "/inventory/units/scan", label: "QRスキャン" },
  { href: "/inventory/settings", label: "設定" },
];

export function InventoryTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-4 overflow-x-auto border-b border-slate-300 pb-2">
      <div className="flex min-w-max gap-2">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`rounded-sm border px-3 py-1.5 text-sm font-medium ${pathname === tab.href ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
          {tab.label}
        </Link>
      ))}
      </div>
    </div>
  );
}
