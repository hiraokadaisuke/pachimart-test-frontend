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
    <header className="w-full border-b border-slate-700 bg-slate-800 text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/inventory" className="text-base font-semibold tracking-wide text-white">
            在庫管理（出入番頭）
          </Link>
          <nav className="flex items-center gap-2 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive =
                item.type
                  ? pathname === "/inventory/items" && activeType === item.type
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border border-transparent px-3 py-1",
                    isActive
                      ? "border-white bg-white/10 text-white"
                      : "text-slate-200 hover:border-white/40 hover:bg-white/5",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Link href="/portal" className="text-xs font-semibold text-slate-200 hover:text-white">
          /portalへ戻る
        </Link>
      </div>
    </header>
  );
}
