"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export type SubTab = {
  label: string;
  href: string;
  isActive?: boolean;
  matchPrefixes?: string[];
};

export type SubTabsProps = {
  tabs: SubTab[];
  className?: string;
};

const isActiveLink = (
  pathname: string | null,
  href: string,
  matchPrefixes?: string[],
  searchParams?: URLSearchParams,
) => {
  if (!pathname) return false;
  const [hrefPath, hrefQuery] = href.split("?");
  const hrefSearch = hrefQuery ? new URLSearchParams(hrefQuery) : null;

  if (pathname === hrefPath) {
    if (!hrefSearch) return true;
    if (searchParams) {
      const allMatch = Array.from(hrefSearch.entries()).every(([key, value]) => searchParams.get(key) === value);
      if (allMatch) return true;
    }
    const hrefTab = hrefSearch.get("tab");
    const searchTab = searchParams?.get("tab");
    if (!searchTab && hrefTab === "progress") return true;
    return false;
  }

  if (pathname.startsWith(`${hrefPath}/`)) return !hrefSearch;

  if (matchPrefixes) {
    return matchPrefixes.some((prefix) => {
      const [prefixPath, prefixQuery] = prefix.split("?");
      const prefixSearch = prefixQuery ? new URLSearchParams(prefixQuery) : null;
      const matchesPath = pathname === prefixPath || pathname.startsWith(`${prefixPath}/`);
      if (!matchesPath) return false;
      if (!prefixSearch) return true;
      if (!searchParams) return false;
      return Array.from(prefixSearch.entries()).every(([key, value]) => searchParams.get(key) === value);
    });
  }

  return false;
};

function SubTabsContent({ tabs, className }: SubTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className={`overflow-x-auto pb-1 ${className ?? ""}`} aria-label="サブタブ">
      <ul className="flex min-w-full gap-6 border-b border-slate-200 px-1">
        {tabs.map((tab) => {
          const active =
            typeof tab.isActive === "boolean"
              ? tab.isActive
              : isActiveLink(pathname, tab.href, tab.matchPrefixes, searchParams ?? undefined);
          return (
            <li key={tab.href} className="flex-shrink-0">
              <Link
                href={tab.href}
                className={`inline-flex h-10 items-center border-b-2 px-1 text-sm font-medium transition-colors ${
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-neutral-700 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SubTabs(props: SubTabsProps) {
  return (
    <Suspense fallback={<div className="h-10" aria-hidden />}>
      <SubTabsContent {...props} />
    </Suspense>
  );
}

export default SubTabs;
