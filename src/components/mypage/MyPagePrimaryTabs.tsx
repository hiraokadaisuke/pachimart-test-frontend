"use client";

import Link from "next/link";

export type MyPageSectionKey =
  | "products"
  | "trade"
  | "notifications"
  | "balance"
  | "settings";

type MyPageSection = {
  key: MyPageSectionKey;
  label: string;
  href: string;
  matchPatterns: string[];
};

export const MY_PAGE_SECTIONS: MyPageSection[] = [
  {
    key: "products",
    label: "商品",
    href: "/market/mypage/exhibits",
    matchPatterns: [
      "/market/mypage/exhibits",
      "/mypage/drafts",
      "/mypage/inquiry-messages",
    ],
  },
  {
    key: "trade",
    label: "取引",
    href: "/market/navi",
    matchPatterns: [
      "/market/navi",
      "/mypage/dealings",
      "/mypage/todo-list",
      "/mypage/inquiry-messages",
    ],
  },
  {
    key: "notifications",
    label: "通知",
    href: "/mypage/notices",
    matchPatterns: ["/mypage/notices", "/mypage/pachi-notice"],
  },
  {
    key: "balance",
    label: "残高",
    href: "/mypage/pachipay/balance",
    matchPatterns: ["/mypage/pachipay"],
  },
  {
    key: "settings",
    label: "設定",
    href: "/mypage/user/profile/edit",
    matchPatterns: [
      "/mypage/user",
      "/mypage/company",
      "/mypage/machine-storage-locations",
      "/mypage/apply-notification",
      "/mypage/exhibit-user-color",
      "/mypage/pachi-notification-settings",
    ],
  },
];

const isMatchingPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function detectMyPageSection(pathname: string): MyPageSection | null {
  for (const section of MY_PAGE_SECTIONS) {
    if (section.matchPatterns.some((pattern) => isMatchingPrefix(pathname, pattern))) {
      return section;
    }
  }
  return null;
}

export function MyPagePrimaryTabs({ activeKey }: { activeKey?: MyPageSectionKey }) {
  return (
    <nav className="flex gap-2 overflow-x-auto py-3 text-sm">
      {MY_PAGE_SECTIONS.map((section) => {
        const isActive = section.key === activeKey;
        return (
          <Link
            key={section.key}
            href={section.href}
            className={[
              "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 font-semibold",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-neutral-900 hover:bg-slate-200",
            ].join(" ")}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
