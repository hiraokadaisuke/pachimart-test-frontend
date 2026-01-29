"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/layout/Header";

const shouldHideHeader = (pathname: string | null) => {
  if (!pathname) return false;
  return pathname.startsWith("/market") || pathname.startsWith("/portal");
};

export default function AppHeader() {
  const pathname = usePathname();
  if (shouldHideHeader(pathname)) {
    return null;
  }
  return <Header />;
}
