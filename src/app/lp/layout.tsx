// src/app/lp/layout.tsx
import type { ReactNode } from 'react';
import { LpFooter } from '@/components/lp/LpFooter';
import { LpHeader } from '@/components/lp/LpHeader';

// 追加: LP ページ用に Google Fonts を読み込む
import { Inter, Noto_Sans_JP } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});
const noto = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

export default function LpLayout({ children }: { children: ReactNode }) {
  return (
    // 追加: 読み込んだフォントをこのページに適用する
    <div className={`${inter.className} ${noto.className} flex min-h-screen flex-col bg-[#F7FBFD] text-slate-900`}>
      <LpHeader />
      <main className="flex-1">{children}</main>
      <LpFooter />
    </div>
  );
}