"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/inventory/new", label: "在庫登録" },
  { href: "/inventory", label: "在庫一覧" },
  {
    label: "購入伝票",
    items: [
      { href: "/inventory/purchase-invoice/create", label: "購入伝票作成" },
      { href: "/inventory/purchase-invoice/list", label: "購入伝票一覧" },
    ],
  },
  {
    label: "販売伝票",
    items: [
      { href: "/inventory/sales-invoice/create", label: "販売伝票作成" },
      { href: "/inventory/sales-invoice/list", label: "販売伝票一覧" },
    ],
  },
  { href: "/inventory/profit", label: "利益管理" },
  {
    label: "詳細設定",
    items: [
      { href: "/inventory/settings?mode=customer&tab=corp", label: "取引先管理" },
      { href: "/inventory/settings?mode=self&tab=corp", label: "自社設定" },
    ],
  },
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav className="w-full border-b border-gray-300 bg-slate-100 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4" ref={navRef}>
          <Link href="/" className="text-lg font-bold text-slate-700">
            パチマート
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => {
              if ("items" in item) {
                const isMenuOpen = openMenu === item.label;
                const isParentActive = item.items.some((subItem) =>
                  isActive(pathname, searchParams, subItem.href),
                );
                return (
                  <div key={item.label} className="relative">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-none border border-gray-300 px-4 py-2 text-sm font-semibold shadow-none transition hover:bg-white hover:text-slate-800 ${
                        isParentActive
                          ? "bg-white text-slate-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                      onClick={() => setOpenMenu((prev) => (prev === item.label ? null : item.label))}
                      aria-expanded={isMenuOpen}
                      aria-haspopup="menu"
                    >
                      {item.label}
                      <span className="text-xs">▾</span>
                    </button>
                    {isMenuOpen && (
                      <div className="absolute left-0 z-10 mt-1 w-40 border border-slate-200 bg-white shadow-lg">
                        {item.items.map((subItem) => {
                          const active = isActive(pathname, searchParams, subItem.href);
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setOpenMenu(null)}
                              className={`block px-3 py-2 text-sm transition hover:bg-slate-50 ${
                                active ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

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
