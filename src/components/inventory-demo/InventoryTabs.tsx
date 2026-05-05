"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/inventory", label: "ダッシュボード" },
  { href: "/inventory/items", label: "在庫物件一覧" },
  { href: "/inventory/inbound", label: "入庫予定" },
  { href: "/inventory/outbound", label: "発送予定" },
  { href: "/inventory/activity", label: "在庫の動き" },
];

export function InventoryTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`rounded-md border px-3 py-2 text-sm ${pathname === tab.href ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
