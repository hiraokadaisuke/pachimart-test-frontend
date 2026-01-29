import type { ReactNode } from "react";

import Footer from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 w-full max-w-none mx-0 px-0">{children}</main>
      <Footer />
    </div>
  );
}
