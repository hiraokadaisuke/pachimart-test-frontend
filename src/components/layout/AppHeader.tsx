"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/layout/Header";

const shouldHideHeader = (pathname: string | null) => {
  if (!pathname) return false;
  return (
    pathname.startsWith("/market") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/agency") ||
    pathname.startsWith("/accounting") ||
    pathname.startsWith("/analytics")
  );
};

export default function AppHeader() {
  const pathname = usePathname();
  if (shouldHideHeader(pathname)) {
    return null;
  }
  return <Header />;
}
