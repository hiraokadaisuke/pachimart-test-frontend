"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

import MainContainer from "@/components/layout/MainContainer";

const isMatching = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function MypageLayoutClient({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuGroups = [
    {
      title: "商品管理",
      items: [
        { label: "出品中", href: "/mypage/exhibits" },
        { label: "下書き", href: "/mypage/drafts" },
      ],
    },
    {
      title: "取引",
      items: [
        { label: "購入一覧", href: "/mypage/dealings/purchases" },
        { label: "売却一覧", href: "/mypage/dealings/sales" },
        { label: "やる事リスト", href: "/mypage/todo-list" },
        { label: "商品へのコメント / 取引メッセージ", href: "/mypage/inquiry-messages" },
      ],
    },
  ];

  return (
    <MainContainer variant="full">
      <div className="flex w-full">
        {isSidebarOpen && (
          <aside className="w-[220px] border-r border-gray-200 bg-gray-50 px-4 py-6 text-sm">
            {menuGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <div className="mb-2 text-xs font-semibold text-gray-500">{group.title}</div>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active = isMatching(pathname, item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`rounded px-3 py-1 transition ${
                          active
                            ? "bg-gray-100 font-semibold text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
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
        )}

        <div className="flex-1 px-4 py-6">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              {isSidebarOpen ? "メニューを閉じる" : "メニューを開く"}
            </button>
          </div>
          {children}
        </div>
      </div>
    </MainContainer>
  );
}
