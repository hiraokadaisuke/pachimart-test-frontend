"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BalanceSummaryBar, { BalanceSummary } from "@/components/pachipay/BalanceSummaryBar";
import MainContainer from "@/components/layout/MainContainer";
import { MY_PAGE_SECTIONS, MyPageSectionKey } from "@/lib/layout/sections";

const defaultBalanceSummary: BalanceSummary = {
  plannedPurchase: 1_000_000,
  plannedSales: 2_000_000,
  available: 1_500_000,
};

const isMatchingPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const findActiveSection = (pathname: string): MyPageSectionKey | null => {
  let matchedKey: MyPageSectionKey | null = null;
  let longest = -1;

  for (const section of MY_PAGE_SECTIONS) {
    for (const prefix of section.matchers) {
      if (isMatchingPrefix(pathname, prefix) && prefix.length > longest) {
        matchedKey = section.key;
        longest = prefix.length;
      }
    }
  }

  return matchedKey;
};

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeSection = pathname ? findActiveSection(pathname) : null;

  return (
    <div className="w-full">
      <div className="border-b border-slate-200 bg-white">
        <MainContainer variant="wide">
          <nav className="flex gap-2 overflow-x-auto py-3 text-sm">
            {MY_PAGE_SECTIONS.map((section) => {
              const isActive = section.key === activeSection;
              return (
                <Link
                  key={section.key}
                  href={section.href}
                  className={[
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 font-semibold",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {section.label}
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
