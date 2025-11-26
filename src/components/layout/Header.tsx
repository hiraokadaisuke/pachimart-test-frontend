'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  { label: '商品一覧', href: '/products' },
  { label: '新規出品', href: '/sell' },
  { label: 'お知らせ', href: '#' },
  { label: 'やる事リスト', href: '#' },
  { label: '商品のコメント', href: '#' },
  { label: 'パチ通知', href: '#' },
];

const searchTabs = ['パチンコ', 'スロット'];

export default function Header() {
  const pathname = usePathname();
  const isProductsPage = pathname === '/products';
  const [activeTab, setActiveTab] = useState<string>('パチンコ');

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="mx-auto flex h-[56px] w-full max-w-[1280px] items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/products" className="flex items-center">
            <span className="text-xl font-bold text-[#0070a8] whitespace-nowrap">パチマート</span>
          </Link>
          <nav className="ml-6 flex items-center text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="ml-6 transition hover:text-blue-600 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="#"
              className="flex h-9 items-center rounded border border-blue-600 bg-white px-4 text-sm text-blue-600 whitespace-nowrap"
            >
              お問い合わせ
            </Link>
            <Link
              href="/mypage/exhibits"
              className="flex h-9 items-center gap-1 rounded bg-blue-700 px-4 text-sm font-semibold text-white whitespace-nowrap"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-700">👤</span>
              <span>マイページ</span>
            </Link>
          </div>
          <div className="ml-3 text-xs leading-tight text-gray-700 whitespace-normal">
            <div className="whitespace-nowrap">平岡大祐 さん</div>
            <div className="whitespace-nowrap">パチマート残高 ¥2,270,650</div>
          </div>
        </div>
      </div>

      {isProductsPage && (
        <div className="w-full bg-[#0A2A43] py-3">
          <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4">
            <div className="flex bg-[#082337] p-1 rounded-full">
              {searchTabs.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={
                      isActive
                        ? 'bg-white text-blue-900 rounded-full px-4 py-1 text-sm font-semibold'
                        : 'text-white px-4 py-1 text-sm'
                    }
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            <select className="h-10 bg-white border border-gray-300 rounded px-3 text-sm text-gray-800">
              <option>メーカーを指定しない</option>
            </select>

            <input
              type="text"
              placeholder="機種名を指定"
              className="h-10 flex-1 bg-white border border-gray-300 rounded px-3 text-sm text-gray-800"
            />

            <div className="ml-auto flex items-center gap-3">
              <button type="button" className="text-blue-100 text-xs underline">
                絞り込み条件を追加
              </button>
              <button
                type="button"
                className="bg-[#007BFF] text-white px-5 h-10 rounded text-sm font-semibold"
              >
                検索
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
