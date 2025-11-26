import Link from 'next/link';

import { products } from '@/lib/dummyData';

export default function MyPageExhibitsPage() {
  const listedProducts = products.filter((product) => product.status === '出品中');
  const currencyFormatter = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">出品中の商品</h1>
          <p className="mt-1 text-xs text-gray-500">全件数：{listedProducts.length}件</p>
        </div>
        <button className="rounded bg-[#007bff] px-4 py-2 text-sm font-semibold text-white">新規出品</button>
      </div>

      <div className="mt-4 overflow-x-auto rounded bg-white shadow-sm">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                更新日
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                機種名
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                商品単価
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                出品数
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                販売数
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                残数
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                撤去日
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                状況
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                備考
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {listedProducts.map((product, idx) => {
              const zebra = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

              return (
                <tr key={product.id} className={zebra}>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">{product.updatedAt}</td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">
                    <Link
                      href={`/products/${product.id}`}
                      className="whitespace-normal break-words text-blue-700 hover:underline"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">
                    {currencyFormatter.format(product.price)}
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">{product.quantity}</td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">0</td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">{product.quantity}</td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">{product.removalDate}</td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">
                    <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                      出品中
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">{product.note ?? '-'}</td>
                  <td className="border-b border-gray-100 px-3 py-2 align-top">
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white">編集</button>
                      <button className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700">取り下げ</button>
                      <button className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white">削除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
