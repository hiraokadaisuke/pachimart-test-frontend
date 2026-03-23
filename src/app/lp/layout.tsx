import type { ReactNode } from 'react';

import { LpFooter } from '@/components/lp/LpFooter';
import { LpHeader } from '@/components/lp/LpHeader';

export default function LpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7FBFD] text-slate-900">
      <LpHeader />
      <main className="flex-1">{children}</main>
      <LpFooter />
    </div>
  );
}
