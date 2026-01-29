import type { ReactNode } from "react";

import AppHeader from "@/components/layout/AppHeader";
import Footer from "@/components/layout/Footer";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 w-full max-w-none mx-0 px-0">{children}</main>
      <Footer />
    </div>
  );
}
