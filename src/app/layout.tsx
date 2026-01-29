import type { Metadata } from 'next';
import './globals.css';
import { BalanceProvider } from '@/lib/balance/BalanceContext';
import { DevUserProvider } from '@/lib/dev-user/DevUserContext';
import { DevUserSwitcherFloating } from '@/lib/dev-user/DevUserSwitcherFloating';

export const metadata: Metadata = {
  title: 'パチマート | 中古機売買サービス（クローンUI）',
  description: 'パチンコ・スロット中古機売買サービス「パチマート」のクローンUIデモ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-black">
        <DevUserProvider>
          <BalanceProvider>
            {children}
            <DevUserSwitcherFloating />
          </BalanceProvider>
        </DevUserProvider>
      </body>
    </html>
  );
}
