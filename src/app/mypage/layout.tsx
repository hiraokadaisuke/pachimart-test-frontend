'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MainContainer from '@/components/layout/MainContainer';

export default function MypageLayout({ children }: { children: ReactNode }) {
  return (
    <MainContainer>
      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <MypageSideMenu />
        <div className="space-y-6">{children}</div>
      </div>
    </MainContainer>
  );
}

function MypageSideMenu() {
  const pathname = usePathname();

  const menuGroups = [
    {
      title: '商品の管理',
      items: [
        { label: '出品中', href: '/mypage/exhibits' },
        { label: '下書き', href: '#' },
      ],
    },
    {
      title: '取引の管理',
      items: [
        { label: '購入一覧', href: '#' },
        { label: '売却一覧', href: '#' },
      ],
    },
    {
      title: 'パチマート残高管理',
      items: [
        { label: 'パチマート残高', href: '#' },
        { label: '入出金履歴', href: '#' },
        { label: 'パチマートへの入金口座', href: '#' },
        { label: 'パチマートからの出金申請', href: '#' },
        { label: '振込先口座登録・変更', href: '#' },
      ],
    },
    {
      title: '設定',
      items: [
        { label: '担当者情報の設定', href: '#' },
        { label: '遊技機保管倉庫の設定', href: '#' },
      ],
    },
  ];

  return (
    <aside className="border-r border-gray-200 pr-4 text-sm">
      {menuGroups.map((group) => (
        <div key={group.title} className="mb-6">
          <div className="mb-2 text-xs font-semibold text-gray-500">{group.title}</div>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded px-3 py-1 transition ${
                    active
                      ? 'bg-gray-100 font-semibold text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
