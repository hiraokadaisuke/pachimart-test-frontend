"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "取込", href: "/inventory/import" },
  { label: "在庫物件", href: "/inventory/items?type=stock", type: "stock" },
  { label: "非在庫物件", href: "/inventory/items?type=inactive", type: "inactive" },
  { label: "設置物件", href: "/inventory/items?type=installed", type: "installed" },
  { label: "設定", href: "/inventory/settings" },
];

export default function InventoryHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeType = searchParams?.get("type") ?? "stock";

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/inventory" className="text-lg font-semibold text-[#2A8FA0]">
            在庫管理
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            {navItems.map((item) => {
              const isActive =
                item.type
                  ? pathname === "/inventory/items" && activeType === item.type
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1 transition",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Link href="/portal" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          /portalへ戻る
        </Link>
      </div>
    </header>
  );
}
