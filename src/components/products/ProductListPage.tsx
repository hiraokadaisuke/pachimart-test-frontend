"use client";

import Link from 'next/link';
import { useState } from 'react';

import { products } from '@/lib/dummyData';
import type { Product } from '@/types/product';

const productTabs = ['パチンコ', 'スロット'];
const sortOptions = ['古い順', '新しい順', '安い順', '高い順'];

const formatPrice = (price: number) => `${price.toLocaleString()} 円`;

const statusStyles: Record<Product['status'], string> = {
  出品中: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  成約済: 'text-slate-600 bg-slate-100 border-slate-200',
  下書き: 'text-amber-700 bg-amber-50 border-amber-200',
};

export default function ProductListPage() {
  const [activeTab, setActiveTab] = useState<string>('パチンコ');
  const [activeSort, setActiveSort] = useState<string>('新しい順');

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-slate-800">商品一覧から探す</h1>
        <div className="flex gap-2">
          {productTabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select className="w-full min-w-[160px] rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-auto">
            <option>メーカー指定なし</option>
          </select>
          <input
            type="text"
            placeholder="機種名を指定"
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="button" className="text-sm font-semibold text-blue-600 hover:underline">
            絞り込み条件を追加
          </button>
          <div className="ml-auto flex items-center">
            <button
              type="button"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              検索
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-4 text-sm font-semibold text-slate-600">
          {sortOptions.map((option) => {
            const isActive = option === activeSort;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setActiveSort(option)}
                className={`transition-colors hover:text-blue-600 ${
                  isActive ? 'text-blue-600 underline underline-offset-8' : 'text-slate-600'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">更新日</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">状況</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">前設置</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">メーカー</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">機種名</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">タイプ</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">台数</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">価格</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">撤去日</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">返答時間</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">出品者</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">備考</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const isContracted = product.status === '成約済';
              const zebra = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
              const rowStyle = isContracted ? 'bg-slate-100 text-slate-500' : zebra;

              return (
                <tr key={product.id} className={`${rowStyle} transition-colors`}>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.updatedAt}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${statusStyles[product.status]}`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.prefecture}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.maker}</td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/products/${product.id}`} className="text-blue-600 hover:underline">
                      {product.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{`${product.quantity} / ${product.quantity}`}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-slate-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.removalDate}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.replyTime}</td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">{product.sellerName}</td>
                  <td className="px-4 py-3 align-top text-slate-600">{product.note ?? '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
