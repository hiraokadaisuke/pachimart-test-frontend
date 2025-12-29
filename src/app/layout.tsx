import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 w-full max-w-none mx-0 px-0">
                {children}
              </main>
              <Footer />
            </div>
            <DevUserSwitcherFloating />
          </BalanceProvider>
        </DevUserProvider>
      </body>
    </html>
  );
}
