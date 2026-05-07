"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "在庫管理", href: "/inventory" },
  { label: "在庫一覧", href: "/inventory/items" },
  { label: "入庫予定", href: "/inventory/inbound" },
  { label: "発送予定", href: "/inventory/outbound" },
  { label: "棚卸", href: "/inventory/stocktakes" },
  { label: "設定", href: "/inventory/settings" },
];

export default function InventoryHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-slate-200 bg-white text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md border px-3 py-1.5",
                pathname === item.href ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 hover:bg-slate-50",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/portal" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
          /portalへ戻る
        </Link>
      </div>
    </header>
  );
}
