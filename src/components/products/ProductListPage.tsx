"use client";

import Link from 'next/link';
import { useState } from 'react';

import { products } from '@/lib/dummyData';
import type { Product } from '@/types/product';

const productTabs = ['パチンコ', 'スロット'];
const sortOptions = ['古い順', '新しい順', '安い順', '高い順'];

const formatPrice = (price: number) => `${price.toLocaleString()} 円`;

const statusStyles: Record<Product['status'], string> = {
  出品中: 'bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded',
  成約済: 'bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded',
  下書き: 'bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded',
};

export default function ProductListPage() {
  const [activeTab, setActiveTab] = useState<string>('パチンコ');
  const [activeSort, setActiveSort] = useState<string>('新しい順');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900">
        <div className="flex w-full flex-wrap items-center gap-3 px-0 py-4">
          <div className="flex rounded-full bg-blue-800 p-1">
            {productTabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    isActive ? 'bg-white text-blue-900' : 'bg-transparent text-white'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <select className="h-9 rounded border border-gray-300 px-2 text-sm text-gray-800">
            <option>メーカー指定なし</option>
          </select>

          <input
            type="text"
            placeholder="機種名を指定"
            className="h-9 min-w-[220px] flex-1 rounded border border-gray-300 px-2 text-sm text-gray-800"
          />

          <div className="ml-auto flex items-center gap-3">
            <button type="button" className="text-xs text-blue-100 underline">
              絞り込み条件を追加
            </button>
            <button
              type="button"
              className="h-9 rounded bg-[#007bff] px-5 text-sm font-semibold text-white"
            >
              検索
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-0">
        <h1 className="text-xl font-bold text-slate-800">商品一覧から探す</h1>

        <div className="mt-3 flex justify-end gap-4 text-xs">
          {sortOptions.map((option) => {
            const isActive = option === activeSort;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setActiveSort(option)}
                className={`transition-colors ${
                  isActive ? 'font-semibold text-blue-600 underline' : 'text-gray-500 hover:underline'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="mt-3 w-full overflow-x-auto px-0">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">更新日</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">状況</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">前設置</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">メーカー</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">機種名</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">タイプ</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">台数</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">価格</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">撤去日</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">返答時間</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">出品者</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">備考</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => {
                const isContracted = product.status === '成約済';
                const zebra = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                const rowStyle = isContracted ? 'bg-gray-100' : zebra;

                return (
                  <tr key={product.id} className={rowStyle}>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.updatedAt}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top border-b border-gray-100">
                      <span className={`inline-flex items-center ${statusStyles[product.status]}`}>{product.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.prefecture}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.maker}</td>
                    <td className="px-3 py-2 align-top whitespace-normal break-words text-gray-900 border-b border-gray-100">
                      <Link href={`/products/${product.id}`} className="text-blue-700 hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.type}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{`${product.quantity} / ${product.quantity}`}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-gray-900 border-b border-gray-100">{formatPrice(product.price)}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.removalDate}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.replyTime}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.sellerName}</td>
                    <td className="px-3 py-2 align-top whitespace-normal break-words text-gray-700 border-b border-gray-100">{product.note ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
