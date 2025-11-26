import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pachimart Items',
  description: 'Sample item listing built with Next.js and Tailwind CSS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <a className="text-xl font-semibold" href="/">
              Pachimart
            </a>
            <nav className="space-x-4 text-sm font-medium text-slate-600">
              <a className="hover:text-slate-900" href="/items">
                Items
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 text-center text-sm text-slate-500">
            Demo project powered by Next.js
          </div>
        </footer>
      </body>
    </html>
  );
}
