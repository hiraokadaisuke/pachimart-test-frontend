"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

import { formatCurrency } from "@/lib/currency";
import type { BalanceSummary } from "@/types/balance";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";
import { dummyBalances } from "@/lib/dummyBalances";
import { InventorySearchBar } from "../inventory/InventorySearchBar";

const navLinks: { label: string; href: string; matchPrefixes?: string[] }[] = [
  { label: "商品を探す", href: "/products" },
  {
    label: "出品",
    href: "/mypage/exhibits",
    matchPrefixes: ["/mypage/exhibits", "/sell"],
  },
  { label: "ナビ管理", href: "/trade-navi" },
  {
    label: "入出金管理",
    href: "/cashflow-navi",
    matchPrefixes: ["/cashflow-navi"],
  },
  { label: "通知", href: "/mypage/notices", matchPrefixes: ["/mypage/notices", "/mypage/pachi-notice"] },
  { label: "設定", href: "/mypage/settings", matchPrefixes: ["/mypage/user", "/mypage/company", "/mypage/machine-storage-locations", "/mypage/pachi-notification-settings", "/mypage/settings"] },
];

const fallbackBalanceSummary: BalanceSummary = {
  plannedPurchase: 1_000_000,
  plannedSales: 2_000_000,
  available: 1_500_000,
};

const searchTabs = ["パチンコ", "スロット"];

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
  const balanceSummary =
    dummyBalances.find((balance) => balance.userId === currentUser.id) ?? fallbackBalanceSummary;
  const pathname = usePathname();
  const isProductsPage = pathname === "/products" || pathname?.startsWith("/products/");
  const isInventoryPage = pathname?.startsWith("/inventory");
  const [activeTab, setActiveTab] = useState<string>("パチンコ");
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
              <div className="font-semibold text-slate-900">購入予定残高 {formatCurrency(balanceSummary.plannedPurchase)}</div>
              <div className="font-semibold text-slate-900">売却予定残高 {formatCurrency(balanceSummary.plannedSales)}</div>
              <div className="font-semibold text-slate-900">利用可能残高 {formatCurrency(balanceSummary.available)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/mypage/inquiry-messages"
                className="flex h-9 items-center rounded border border-blue-600 bg-white px-3 text-sm text-blue-600 transition hover:bg-blue-50"
              >
                お問い合わせ
              </Link>
              <Link href="/inventory" className="text-sm font-semibold text-neutral-800 transition hover:text-blue-700">
                在庫管理 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isProductsPage && (
        <div className="w-full bg-[#0A2A43] py-3">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4">
            <div className="flex bg-[#082337] p-1 rounded-full">
              {searchTabs.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={
                      isActive
                        ? "rounded-full bg-white px-4 py-1 text-sm font-semibold text-blue-900"
                        : "px-4 py-1 text-sm text-white"
                    }
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <select className="h-10 rounded border border-gray-300 bg-white px-3 text-sm text-gray-800">
              <option>メーカーを指定しない</option>
            </select>

            <input
              type="text"
              placeholder="機種名を指定"
              className="h-10 flex-1 rounded border border-gray-300 bg-white px-3 text-sm text-gray-800"
            />

            <div className="ml-auto flex items-center gap-3">
              <button type="button" className="text-xs text-blue-100 underline">
                絞り込み条件を追加
              </button>
              <button
                type="button"
                className="h-10 rounded bg-[#007BFF] px-5 text-sm font-semibold text-white"
              >
                検索
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
