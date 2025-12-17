"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/inventory", label: "在庫一覧" },
  { href: "/purchase-invoices/create", label: "購入伝票作成" },
  { href: "/purchase-invoices", label: "購入伝票一覧" },
];

const isActive = (path: string, href: string) => {
  if (href === "/purchase-invoices") {
    return path.startsWith("/purchase-invoices");
  }
  if (href === "/inventory") {
    return path.startsWith("/inventory");
  }
  return path === href;
};

export function InventoryNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="w-full border-b border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-white hover:text-sky-700 ${
                active
                  ? "bg-white text-sky-700 ring-1 ring-sky-200"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
