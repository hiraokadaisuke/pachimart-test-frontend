"use client";

import SubTabs, { type SubTab } from "@/components/ui/SubTabs";
import { usePathname } from "next/navigation";

const SETTINGS_TABS: SubTab[] = [
  { label: "担当者情報", href: "/mypage/user/profile/edit", matchPrefixes: ["/mypage/user/profile"] },
  { label: "企業情報", href: "/mypage/company/edit", matchPrefixes: ["/mypage/company/edit"] },
  { label: "社内アカウント", href: "/mypage/company/users", matchPrefixes: ["/mypage/company/users"] },
  { label: "倉庫設定", href: "/mypage/machine-storage-locations" },
  { label: "パスワード変更", href: "/mypage/user/reset-password" },
  { label: "取引情報通知先", href: "/mypage/apply-notification" },
  { label: "出品者色分け", href: "/mypage/exhibit-user-color" },
  { label: "通知設定", href: "/mypage/pachi-notification-settings" },
];

export function SettingsSubTabs() {
  const pathname = usePathname() ?? "";

  const tabs = SETTINGS_TABS.map((tab) => ({
    ...tab,
    isActive:
      pathname === tab.href ||
      tab.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  }));

  return <SubTabs tabs={tabs} />;
}

export default SettingsSubTabs;
