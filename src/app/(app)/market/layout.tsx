import type { ReactNode } from "react";

import Header from "@/components/layout/Header";

export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
