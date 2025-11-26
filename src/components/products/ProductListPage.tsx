"use client";

import Link from 'next/link';
import { useState } from 'react';

import { products } from '@/lib/dummyData';
import type { Product } from '@/types/product';

const sortOptions = ['古い順', '新しい順', '安い順', '高い順'];

const formatPrice = (price: number) => `${price.toLocaleString()} 円`;

const statusStyles: Record<Product['status'], string> = {
  出品中: 'bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded',
  成約済: 'bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded',
  下書き: 'bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded',
};

const formatMonthDay = (dateString: string) => {
  const [, month, day] = dateString.split('/');
  if (!month || !day) return dateString;

  return `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
};

export default function ProductListPage() {
  const [activeSort, setActiveSort] = useState<string>('新しい順');

  return (
    <div className="w-full bg-white">
      <div className="w-full max-w-[1400px] mx-auto px-4 xl:px-8 py-6 space-y-6 bg-white">
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
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[90px]">更新日</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[70px]">状況</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[90px]">前設置</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[85px]">メーカー</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[240px]">機種名</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700">タイプ</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[70px]">台数</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[90px]">価格</th>
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700 min-w-[90px]">撤去日</th>
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
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100 min-w-[90px]">{formatMonthDay(product.updatedAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top border-b border-gray-100 min-w-[70px]">
                      <span className={`inline-flex items-center ${statusStyles[product.status]}`}>{product.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100 min-w-[90px]">{product.prefecture}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100 min-w-[85px]">{product.maker}</td>
                    <td className="px-3 py-2 align-top whitespace-nowrap text-gray-900 border-b border-gray-100 min-w-[240px]">
                      <Link href={`/products/${product.id}`} className="text-blue-700 hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100">{product.type}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100 min-w-[70px]">{`${product.quantity} / ${product.quantity}`}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-gray-900 border-b border-gray-100 min-w-[90px]">{formatPrice(product.price)}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-gray-800 border-b border-gray-100 min-w-[90px]">{formatMonthDay(product.removalDate)}</td>
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
