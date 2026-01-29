"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/inventory" },
  { label: "取込", href: "/inventory/import" },
  { label: "物件一覧", href: "/inventory/items" },
];

export default function InventoryHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/inventory" className="text-lg font-semibold text-[#2A8FA0]">
            Inventory
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
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
            <span className="cursor-not-allowed rounded-full px-3 py-1 text-slate-400">
              設定(準備中)
            </span>
          </nav>
        </div>
        <Link href="/portal" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          /portalへ戻る
        </Link>
      </div>
    </header>
  );
}
