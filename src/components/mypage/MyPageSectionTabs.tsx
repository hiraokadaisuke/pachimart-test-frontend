"use client";

import Link from "next/link";

import type { MyPageSectionKey } from "@/components/mypage/MyPagePrimaryTabs";

export type MyPageSubTab = {
  key: string;
  label: string;
  href: string;
  matchPatterns: string[];
};

type MyPageSubTabsConfig = Partial<Record<MyPageSectionKey, MyPageSubTab[]>>;

const isMatchingPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const MY_PAGE_SUB_TABS: MyPageSubTabsConfig = {
  balance: [
    {
      key: "balance",
      label: "残高",
      href: "/mypage/pachipay/balance",
      matchPatterns: ["/mypage/pachipay/balance"],
    },
    {
      key: "history",
      label: "入出金履歴",
      href: "/mypage/pachipay/transactions",
      matchPatterns: ["/mypage/pachipay/transactions"],
    },
    {
      key: "virtualAccount",
      label: "入金口座",
      href: "/mypage/pachipay/virtual-account",
      matchPatterns: ["/mypage/pachipay/virtual-account"],
    },
    {
      key: "withdraw",
      label: "出金申請",
      href: "/mypage/pachipay/transfer-requests",
      matchPatterns: ["/mypage/pachipay/transfer-requests"],
    },
    {
      key: "payeeAccounts",
      label: "振込先口座",
      href: "/mypage/pachipay/trading-accounts",
      matchPatterns: ["/mypage/pachipay/trading-accounts"],
    },
  ],
  settings: [
    {
      key: "profile",
      label: "担当者情報",
      href: "/mypage/user/profile/edit",
      matchPatterns: ["/mypage/user/profile"],
    },
    {
      key: "company",
      label: "企業情報",
      href: "/mypage/company/edit",
      matchPatterns: ["/mypage/company/edit"],
    },
    {
      key: "companyUsers",
      label: "社内アカウント",
      href: "/mypage/company/users",
      matchPatterns: ["/mypage/company/users"],
    },
    {
      key: "storage",
      label: "倉庫設定",
      href: "/mypage/machine-storage-locations",
      matchPatterns: ["/mypage/machine-storage-locations"],
    },
    {
      key: "password",
      label: "パスワード変更",
      href: "/mypage/user/reset-password",
      matchPatterns: ["/mypage/user/reset-password"],
    },
    {
      key: "applyNotification",
      label: "取引情報通知先",
      href: "/mypage/apply-notification",
      matchPatterns: ["/mypage/apply-notification"],
    },
    {
      key: "exhibitUserColor",
      label: "出品者色分け",
      href: "/mypage/exhibit-user-color",
      matchPatterns: ["/mypage/exhibit-user-color"],
    },
    {
      key: "notificationSettings",
      label: "通知設定",
      href: "/mypage/pachi-notification-settings",
      matchPatterns: ["/mypage/pachi-notification-settings"],
    },
  ],
};

export function MyPageSectionTabs({
  sectionKey,
  pathname,
}: {
  sectionKey: MyPageSectionKey | null;
  pathname: string;
}) {
  if (!sectionKey) return null;

  const subTabs = MY_PAGE_SUB_TABS[sectionKey];
  if (!subTabs || subTabs.length === 0) return null;

  const activeSubTab =
    subTabs.find((tab) =>
      tab.matchPatterns.some((pattern) => isMatchingPrefix(pathname, pattern))
    ) ?? subTabs[0];

  return (
    <nav className="flex gap-2 overflow-x-auto py-2 text-sm">
      {subTabs.map((tab) => {
        const isActive = tab.key === activeSubTab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={[
              "inline-flex items-center whitespace-nowrap rounded-lg border px-3 py-2 font-semibold transition",
              isActive
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
