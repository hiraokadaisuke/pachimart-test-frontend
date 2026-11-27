import type { Metadata } from 'next';
import './globals.css';
import { BalanceProvider } from '@/lib/balance/BalanceContext';
import { DevUserProvider } from '@/lib/dev-user/DevUserContext';
import { DevUserSwitcherFloating } from '@/lib/dev-user/DevUserSwitcherFloating';

export const metadata: Metadata = {
  title: 'Restricted Access',
  description: '',
  robots: { index: false, follow: false, nocache: true },
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
