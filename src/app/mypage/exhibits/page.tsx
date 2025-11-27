"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { products } from "@/lib/dummyData";

export default function MyPageExhibitsPage() {
  const router = useRouter();
  const statusOptions = Array.from(new Set(products.map((product) => product.status)));
  const makerOptions = Array.from(new Set(products.map((product) => product.maker)));
  const typeOptions = Array.from(new Set(products.map((product) => product.type)));
  const removalStatusOptions = Array.from(new Set(products.map((product) => product.removalStatus).filter(Boolean)));

  const defaultFilters = {
    keyword: "",
    status: "出品中",
    maker: "",
    type: "",
    removalStatus: "",
  };

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const currencyFormatter = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
  });
  const statusBadgeStyles: Record<string, string> = {
    出品中: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    成約済: "bg-gray-100 text-gray-700 border border-gray-200",
    下書き: "bg-amber-50 text-amber-700 border border-amber-100",
  };

  const listedProducts = useMemo(() => {
    return products.filter((product) => {
      const keywordMatched = appliedFilters.keyword
        ? `${product.name} ${product.note ?? ""}`.toLowerCase().includes(appliedFilters.keyword.toLowerCase())
        : true;
      const statusMatched = appliedFilters.status ? product.status === appliedFilters.status : true;
      const makerMatched = appliedFilters.maker ? product.maker === appliedFilters.maker : true;
      const typeMatched = appliedFilters.type ? product.type === appliedFilters.type : true;
      const removalStatusMatched = appliedFilters.removalStatus
        ? product.removalStatus === appliedFilters.removalStatus
        : true;

      return keywordMatched && statusMatched && makerMatched && typeMatched && removalStatusMatched;
    });
  }, [appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleReload = () => {
    router.refresh();
  };

  return (
    <section className="space-y-4 text-xs sm:text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">出品中の商品</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-slate-500">
            <span>全件数：{listedProducts.length}件</span>
            <span className="text-slate-400">絞り込み・更新もこの画面から操作できます</span>
          </div>
        </div>
        <Link
          href="/sell"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          新規出品
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">キーワード</label>
            <input
              type="search"
              value={draftFilters.keyword}
              onChange={(event) => setDraftFilters({ ...draftFilters, keyword: event.target.value })}
              placeholder="機種名・備考を検索"
              className="rounded-md border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">状況</label>
            <select
              value={draftFilters.status}
              onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value })}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">メーカー</label>
            <select
              value={draftFilters.maker}
              onChange={(event) => setDraftFilters({ ...draftFilters, maker: event.target.value })}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {makerOptions.map((maker) => (
                <option key={maker} value={maker}>
                  {maker}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">タイプ</label>
            <select
              value={draftFilters.type}
              onChange={(event) => setDraftFilters({ ...draftFilters, type: event.target.value })}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-2">
            <label className="text-[11px] font-semibold text-slate-600">撤去状況 / 倉庫</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={draftFilters.removalStatus}
                onChange={(event) => setDraftFilters({ ...draftFilters, removalStatus: event.target.value })}
                className="rounded-md border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                {removalStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-500">
                倉庫指定や搬出条件は備考欄をご確認ください。
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 text-xs">
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-md border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            リセット
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="rounded-md border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            再読み込み
          </button>
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            絞り込み
          </button>
          <Link
            href="/sell"
            className="inline-flex items-center justify-center rounded-md border border-blue-600 bg-blue-50 px-4 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            新規出品
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-auto border-collapse text-[12px]">
          <colgroup>
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[280px]" />
            <col className="w-[80px]" />
            <col className="w-[110px]" />
            <col className="w-[140px]" />
            <col />
            <col className="w-[210px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
              <th className="px-3 py-2 text-left">更新日</th>
              <th className="px-3 py-2 text-left">状況</th>
              <th className="px-3 py-2 text-left">機種名 / メーカー</th>
              <th className="px-3 py-2 text-left">タイプ</th>
              <th className="px-3 py-2 text-right">台数</th>
              <th className="px-3 py-2 text-right">商品単価</th>
              <th className="px-3 py-2 text-left">撤去 / 倉庫</th>
              <th className="px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {listedProducts.map((product, idx) => {
              const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
              const soldCount = 0;
              const remainingCount = product.quantity - soldCount;

              return (
                <tr key={product.id} className={`${zebra} border-b border-slate-100 text-[12px]`}>
                  <td className="whitespace-nowrap px-3 py-1.5 align-top text-slate-800">{product.updatedAt}</td>
                  <td className="px-3 py-1.5 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                        statusBadgeStyles[product.status] ?? "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 align-top">
                    <Link
                      href={`/products/${product.id}`}
                      className="block max-w-full text-xs font-semibold text-sky-700 underline-offset-2 hover:underline"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span>{product.maker}</span>
                      <span className="text-slate-400">{product.prefecture}</span>
                    </div>
                    <div className="mt-1 text-[11px] leading-tight text-slate-500">
                      備考: {product.note ?? "-"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 align-top text-slate-700">{product.type}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 align-top text-right text-slate-800">
                    <div className="flex flex-col items-end leading-tight">
                      <span className="font-semibold text-slate-900">{product.quantity} 台</span>
                      <span className="text-[11px] text-slate-500">販売 {soldCount} / 残 {remainingCount}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 align-top text-right font-semibold tabular-nums text-slate-900">
                    {currencyFormatter.format(product.price)}
                  </td>
                  <td className="px-3 py-1.5 align-top text-[11px] leading-tight text-slate-700">
                    <div className="font-semibold text-slate-800">{product.removalDate}</div>
                    <div className="mt-0.5 text-slate-500">{product.removalStatus ?? "撤去状況未設定"}</div>
                    <div className="mt-1 text-slate-500">{product.warehouseName}</div>
                  </td>
                  <td className="px-3 py-1.5 align-top">
                    <div className="flex flex-wrap justify-center gap-1">
                      <button
                        className="rounded-md border border-emerald-600 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        onClick={() => router.push(`/transactions/navi/${product.id}/edit`)}
                      >
                        取引Navi
                      </button>
                      <button className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">
                        編集
                      </button>
                      <button className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">
                        取り下げ
                      </button>
                      <button className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100">
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
