"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
  if (pathname === hrefPath && hrefQuery) {
    const hrefSearch = new URLSearchParams(hrefQuery);
    if (searchParams) {
      const allMatch = Array.from(hrefSearch.entries()).every(([key, value]) => searchParams.get(key) === value);
      if (allMatch) return true;
    }
  }
  if (pathname === hrefPath) return true;
  if (pathname.startsWith(`${hrefPath}/`)) return true;
  if (matchPrefixes) {
    return matchPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }
  return false;
};

export function SubTabs({ tabs, className }: SubTabsProps) {
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
                    : "border-transparent text-slate-500 hover:text-slate-700"
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

export default SubTabs;
