"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "ダッシュボード", href: "/inventory" },
  { label: "在庫一覧", href: "/inventory/items" },
  { label: "入庫予定", href: "/inventory/inbound" },
  { label: "出庫予定", href: "/inventory/outbound" },
  { label: "棚卸", href: "/inventory/stocktakes" },
  { label: "QRスキャン", href: "/inventory/units/scan" },
  { label: "設定", href: "/inventory/settings" },
];

export default function InventoryHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-slate-300 bg-white text-slate-900">
      <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-3 px-3 py-2 md:px-4">
        <div className="mr-2 text-xs font-bold tracking-wide text-slate-800">在庫管理 業務OS</div>
        <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-sm border-b-2 border-transparent px-2 py-1",
                pathname === item.href
                  ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 hover:bg-slate-50",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/sales" className="text-[11px] font-semibold text-slate-600 hover:text-slate-900">
          販売管理へ
        </Link>
      </div>
    </header>
  );
}
