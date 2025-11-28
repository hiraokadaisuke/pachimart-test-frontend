"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { formatCurrency } from "@/lib/currency";
import type { BalanceSummary } from "@/types/balance";

const navLinks: { label: string; href: string; matchPrefixes?: string[] }[] = [
  { label: "商品を探す", href: "/products" },
  { label: "出品", href: "/sell" },
  { label: "取引Navi", href: "/trade-navi" },
  { label: "通知", href: "/mypage/notices", matchPrefixes: ["/mypage/notices", "/mypage/pachi-notice"] },
  { label: "残高", href: "/mypage/pachipay/balance", matchPrefixes: ["/mypage/pachipay"] },
  { label: "設定", href: "/mypage/settings", matchPrefixes: ["/mypage/user", "/mypage/company", "/mypage/machine-storage-locations", "/mypage/pachi-notification-settings", "/mypage/settings"] },
];

const defaultBalanceSummary: BalanceSummary = {
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
  const pathname = usePathname();
  const isProductsPage = pathname === "/products" || pathname?.startsWith("/products/");
  const [activeTab, setActiveTab] = useState<string>("パチンコ");

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-4 px-4 py-3 md:flex-nowrap md:py-4">
        <div className="flex items-center gap-6">
          <Link href="/products" className="flex items-center whitespace-nowrap">
            <span className="text-xl font-bold text-[#0070a8]">パチマート</span>
          </Link>
        </div>

        <nav className="order-3 w-full md:order-none md:w-auto md:flex-1">
          <ul className="flex w-full gap-2 overflow-x-auto whitespace-nowrap text-sm font-semibold text-slate-700">
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

        <div className="ml-auto flex items-center gap-3 whitespace-nowrap">
          <div className="text-right text-[11px] leading-tight text-slate-700">
            <div className="font-semibold text-slate-900">購入予定残高 {formatCurrency(defaultBalanceSummary.plannedPurchase)}</div>
            <div className="font-semibold text-slate-900">売却予定残高 {formatCurrency(defaultBalanceSummary.plannedSales)}</div>
            <div className="font-semibold text-slate-900">利用可能残高 {formatCurrency(defaultBalanceSummary.available)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mypage/inquiry-messages"
              className="flex h-9 items-center rounded border border-blue-600 bg-white px-3 text-sm text-blue-600 transition hover:bg-blue-50"
            >
              お問い合わせ
            </Link>
            <Link
              href="/mypage/exhibits"
              className="flex h-9 items-center gap-1 rounded bg-blue-700 px-4 text-sm font-semibold text-white"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-700">👤</span>
              <span>マイページ</span>
            </Link>
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
