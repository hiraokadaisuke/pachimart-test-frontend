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
      <div className="flex items-center justify-between w-full px-4 xl:px-8 max-w-[1400px] mx-auto h-[60px]">
        <div className="flex items-center">
          <Link href="/products" className="text-[26px] font-extrabold tracking-tight text-blue-800">
            パチマート
          </Link>
          <nav className="ml-6 flex items-center text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="ml-6 transition hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded bg-[#E53935] text-white px-3 py-[6px] text-xs font-semibold">
            パチマート2大新サービス登場!!
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-600 text-white text-xs font-semibold px-3 py-[6px]">パチ通知</span>
            <span className="rounded bg-blue-600 text-white text-xs font-semibold px-3 py-[6px]">オファー型売買</span>
          </div>
          <Link
            href="#"
            className="border border-blue-600 text-blue-600 bg-white px-4 py-[6px] text-sm rounded"
          >
            お問い合わせ
          </Link>
          <Link
            href="/mypage/exhibits"
            className="bg-blue-700 text-white px-4 py-[6px] text-sm rounded flex items-center gap-1"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-700">👤</span>
            <span>マイページ</span>
          </Link>
          <div className="flex flex-col text-sm text-gray-700 leading-tight">
            <span className="font-semibold">平岡大祐 さん</span>
            <span className="font-semibold text-blue-800">パチマート残高 ¥2,270,650</span>
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
