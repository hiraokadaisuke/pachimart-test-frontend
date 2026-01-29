"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { formatCurrency } from "@/lib/currency";
import type { BalanceSummary } from "@/types/balance";
import { useBalance } from "@/lib/balance/BalanceContext";
import { usePlannedAmounts } from "@/lib/balance/usePlannedAmounts";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { InventorySearchBar } from "../inventory/InventorySearchBar";

const navLinks: { label: string; href: string; matchPrefixes?: string[] }[] = [
  { label: "商品を探す", href: "/products" },
  {
    label: "出品",
    href: "/mypage/exhibits",
    matchPrefixes: ["/mypage/exhibits", "/sell"],
  },
  { label: "ナビ管理", href: "/navi" },
  {
    label: "決済管理",
    href: "/payments",
    matchPrefixes: ["/payments"],
  },
  { label: "通知", href: "/mypage/notices", matchPrefixes: ["/mypage/notices", "/mypage/pachi-notice"] },
  { label: "設定", href: "/mypage/settings", matchPrefixes: ["/mypage/user", "/mypage/company", "/mypage/machine-storage-locations", "/mypage/pachi-notification-settings", "/mypage/settings"] },
];

const isActiveLink = (pathname: string | null, href: string, matchPrefixes?: string[]) => {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (pathname.startsWith(`${href}/`)) return true;
  if (matchPrefixes) {
    return matchPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }
  return false;
};

export default function Header() {
  const currentUser = useCurrentDevUser();
  const { getBalance } = useBalance();
  const plannedAmounts = usePlannedAmounts(currentUser.id);
  const baseBalance = getBalance(currentUser.id);
  const availableBalance = Math.max(0, baseBalance - plannedAmounts.plannedPurchase);
  const balanceSummary: BalanceSummary = {
    ...plannedAmounts,
    available: availableBalance,
  };
  const pathname = usePathname();
  const isInventoryPage = pathname?.startsWith("/sales");
  const devUserLabel = `${currentUser.companyName}で閲覧中`;
  const isProd = process.env.NEXT_PUBLIC_ENV === "production";

  if (isInventoryPage) {
    return null;
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-4 px-4 py-3 md:flex-nowrap md:py-4">
        <div className="flex items-center gap-6">
          <Link href="/products" className="flex items-center whitespace-nowrap">
            <span className="text-xl font-bold text-[#0070a8]">パチマート</span>
          </Link>
        </div>

        <nav className="flex w-full flex-1 items-center md:w-auto">
          <ul className="flex w-full gap-2 overflow-x-auto whitespace-nowrap text-sm font-semibold text-neutral-900">
            {navLinks.map((link) => {
              const active = isActiveLink(pathname, link.href, link.matchPrefixes);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`inline-flex h-10 items-center rounded-md px-3 transition ${
                      active
                        ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {isInventoryPage && (
          <div className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-4">
            <Suspense fallback={null}>
              <InventorySearchBar />
            </Suspense>
          </div>
        )}

        <div className="ml-auto flex w-full flex-1 flex-wrap items-center justify-end gap-4 whitespace-nowrap md:w-auto md:flex-none">
          {!isProd && (
            <div className="flex items-center text-[12px] leading-tight text-gray-600">
              <div className="rounded border border-gray-300 bg-gray-50 px-2 py-1">
                【テスト環境】{devUserLabel}で閲覧中
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="text-right text-[11px] leading-tight text-neutral-900">
              <div className="font-semibold text-slate-900">
                購入予定金額 <span className="text-red-600">{formatCurrency(balanceSummary.plannedPurchase)}</span>
              </div>
              <div className="font-semibold text-slate-900">売却予定金額 {formatCurrency(balanceSummary.plannedSales)}</div>
              <div className="font-semibold text-slate-900">利用可能残高 {formatCurrency(balanceSummary.available)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/mypage/inquiry-messages"
                className="flex h-9 items-center rounded border border-blue-600 bg-white px-3 text-sm text-blue-600 transition hover:bg-blue-50"
              >
                お問い合わせ
              </Link>
              <Link href="/sales" className="text-sm font-semibold text-neutral-800 transition hover:text-blue-700">
                在庫管理 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
