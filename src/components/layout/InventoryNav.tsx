"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { href: "/inventory/new", label: "在庫登録" },
  { href: "/inventory", label: "在庫一覧" },
  { href: "/inventory/purchase-invoice/create", label: "購入伝票作成" },
  { href: "/inventory/purchase-invoice/list", label: "購入伝票一覧" },
  { href: "/inventory/sales-invoice/create", label: "販売伝票作成" },
  { href: "/inventory/sales-invoice/list", label: "販売伝票一覧" },
  { href: "/inventory/settings?mode=customer&tab=corp", label: "取引先管理" },
  { href: "/inventory/settings?mode=self", label: "自社設定" },
];

const isActive = (path: string, searchParams: URLSearchParams | null, href: string) => {
  if (href === "/inventory") {
    return path === "/inventory";
  }
  const [basePath, queryString] = href.split("?");
  if (basePath === "/inventory/settings") {
    if (path !== "/inventory/settings") return false;
    const hrefParams = new URLSearchParams(queryString);
    const targetMode = hrefParams.get("mode");
    const currentMode = searchParams?.get("mode") ?? "customer";
    return targetMode === currentMode;
  }
  return path.startsWith(basePath);
};

export function InventoryNav() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  return (
    <nav className="w-full border-b border-gray-300 bg-slate-100 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-slate-700">
            パチマート
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, searchParams, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-none border border-gray-300 px-4 py-2 text-sm font-semibold shadow-none transition hover:bg-white hover:text-slate-800 ${
                    active
                      ? "bg-white text-slate-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
