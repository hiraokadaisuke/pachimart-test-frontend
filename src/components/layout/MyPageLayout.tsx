"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BalanceSummaryBar, { BalanceSummary } from "@/components/pachipay/BalanceSummaryBar";
import MainContainer from "@/components/layout/MainContainer";

type MyPageTab = {
  label: string;
  href: string;
  matchers: string[];
};

const tabs: MyPageTab[] = [
  {
    label: "商品",
    href: "/mypage/exhibits",
    matchers: ["/mypage/exhibits", "/mypage/drafts", "/mypage/dealings", "/mypage/todo-list", "/mypage/inquiry-messages"],
  },
  {
    label: "取引Navi",
    href: "/trade-navi",
    matchers: ["/trade-navi", "/transactions/navi"],
  },
  {
    label: "通知",
    href: "/mypage/pachi-notice",
    matchers: ["/mypage/pachi-notice", "/mypage/notices"],
  },
  {
    label: "残高",
    href: "/mypage/pachipay/balance",
    matchers: ["/mypage/pachipay"],
  },
  {
    label: "設定",
    href: "/mypage/user/profile/edit",
    matchers: ["/mypage/user"],
  },
];

const defaultBalanceSummary: BalanceSummary = {
  plannedPurchase: 1_000_000,
  plannedSales: 2_000_000,
  available: 1_500_000,
};

const isActiveTab = (pathname: string, tab: MyPageTab) =>
  tab.matchers.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="w-full">
      <div className="border-b border-slate-200 bg-white">
        <MainContainer variant="wide">
          <nav className="flex gap-2 overflow-x-auto py-3 text-sm">
            {tabs.map((tab) => {
              const isActive = isActiveTab(pathname, tab);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={[
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 font-semibold",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </MainContainer>
      </div>

      <div className="border-b border-slate-200 bg-sky-50">
        <MainContainer variant="wide">
          <BalanceSummaryBar summary={defaultBalanceSummary} />
        </MainContainer>
      </div>

      <div>{children}</div>
    </div>
  );
}
