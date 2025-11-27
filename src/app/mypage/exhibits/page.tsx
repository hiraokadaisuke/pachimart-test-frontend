"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { products } from "@/lib/dummyData";

export default function MyPageExhibitsPage() {
  const router = useRouter();
  const listedProducts = products.filter((product) => product.status === "出品中");
  const currencyFormatter = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  });

  return (
    <section className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">出品中の商品</h1>
          <p className="mt-1 text-xs text-gray-500">全件数：{listedProducts.length}件</p>
        </div>
        <button className="rounded bg-[#007bff] px-4 py-2 text-sm font-semibold text-white">新規出品</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full table-auto border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600">
                更新日
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600 w-[260px]">
                機種名
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-right text-xs font-semibold text-gray-600 w-[100px]">
                商品単価
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-right text-xs font-semibold text-gray-600 w-[80px]">
                出品数
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-right text-xs font-semibold text-gray-600 w-[80px]">
                販売数
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-right text-xs font-semibold text-gray-600 w-[80px]">
                残数
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600 w-[120px]">
                撤去日
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600 w-[120px]">
                状況
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left text-xs font-semibold text-gray-600">
                備考
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-center text-xs font-semibold text-gray-600 w-[140px]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {listedProducts.map((product, idx) => {
              const zebra = idx % 2 === 0 ? "bg-white" : "bg-gray-50";

              return (
                <tr key={product.id} className={`${zebra} border-b border-gray-100 hover:bg-slate-50`}>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">{product.updatedAt}</td>
                  <td className="px-4 py-2 text-gray-800">
                    <Link
                      href={`/products/${product.id}`}
                      className="max-w-[260px] truncate font-medium text-sky-700 hover:underline"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-gray-800">
                    {currencyFormatter.format(product.price)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{product.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">0</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{product.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">{product.removalDate}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      出品中
                    </span>
                  </td>
                  <td className="px-4 py-2 leading-tight text-gray-700">{product.note ?? "-"}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        className="w-full rounded border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        onClick={() => router.push(`/transactions/navi/${product.id}/edit`)}
                      >
                        取引Naviを作成
                      </button>
                      <button className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                        編集
                      </button>
                      <button className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                        取り下げ
                      </button>
                      <button className="w-full rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                        削除
                      </button>
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
