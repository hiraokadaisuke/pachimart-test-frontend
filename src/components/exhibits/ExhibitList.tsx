"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { products } from "@/lib/dummyData";
import { createEmptyNaviDraft, saveNaviDraft } from "@/lib/navi/storage";
import type { Product } from "@/types/product";

const statusBadgeStyles: Record<string, string> = {
  出品中: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  成約済: "bg-gray-100 text-gray-700 border border-gray-200",
  下書き: "bg-amber-50 text-amber-700 border border-amber-100",
};

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  minimumFractionDigits: 0,
});

type ExhibitListProps = {
  status: "出品中" | "下書き";
  onNewExhibit?: () => void;
};

export function ExhibitList({ status, onNewExhibit }: ExhibitListProps) {
  const router = useRouter();
  const defaultFilters = useMemo(
    () => ({
      status,
      maker: "",
      model: "",
      noteKeyword: "",
    }),
    [status]
  );

  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  useEffect(() => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, [defaultFilters]);

  const listedProducts = useMemo(() => {
    return products.filter((product) => {
      const makerMatched = appliedFilters.maker ? product.maker === appliedFilters.maker : true;
      const modelMatched = appliedFilters.model
        ? product.name.toLowerCase().includes(appliedFilters.model.toLowerCase())
        : true;
      const noteMatched = appliedFilters.noteKeyword
        ? (product.note ?? "").toLowerCase().includes(appliedFilters.noteKeyword.toLowerCase())
        : true;
      const statusMatched = appliedFilters.status ? product.status === appliedFilters.status : true;

      return makerMatched && modelMatched && noteMatched && statusMatched;
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

  const handleCreateNaviFromListing = (product: Product) => {
    const draft = createEmptyNaviDraft();

    draft.productId = product.id.toString();
    draft.conditions.unitPrice = product.price;
    draft.conditions.quantity = 1;
    draft.conditions.productName = product.name;
    draft.conditions.makerName = product.maker;
    draft.conditions.location = product.prefecture;

    saveNaviDraft(draft);
    router.push(`/transactions/navi/${draft.id}/edit`);
  };

  const heading = status === "下書き" ? "下書き一覧" : "出品中の商品";

  return (
    <section className="space-y-4 text-xs sm:text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{heading}</h2>
          <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-slate-500">
            <span>全件数：{listedProducts.length}件</span>
            <span className="text-slate-400">絞り込み・更新もこの画面から操作できます</span>
          </div>
        </div>
        {status === "出品中" && (
          <button
            type="button"
            onClick={onNewExhibit}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            新規出品
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md bg-slate-50 px-4 py-3">
        <div className="flex flex-col">{/* メーカー */}
          <label className="mb-1 block text-xs font-semibold text-slate-600">メーカー</label>
          <select
            value={draftFilters.maker}
            onChange={(event) => setDraftFilters({ ...draftFilters, maker: event.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          >
            <option value="">すべて</option>
            {Array.from(new Set(products.map((product) => product.maker))).map((maker) => (
              <option key={maker} value={maker}>
                {maker}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">{/* 機種名 */}
          <label className="mb-1 block text-xs font-semibold text-slate-600">機種名</label>
          <input
            type="search"
            value={draftFilters.model}
            onChange={(event) => setDraftFilters({ ...draftFilters, model: event.target.value })}
            placeholder="機種名で検索"
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
        <div className="flex flex-col sm:min-w-[220px]">{/* 備考キーワード */}
          <label className="mb-1 block text-xs font-semibold text-slate-600">備考</label>
          <input
            type="search"
            value={draftFilters.noteKeyword}
            onChange={(event) => setDraftFilters({ ...draftFilters, noteKeyword: event.target.value })}
            placeholder="備考キーワード"
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">{/* ボタン群 */}
          <button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 rounded-md bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            検索
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            一覧を更新
          </button>
          {status === "出品中" && (
            <button
              type="button"
              onClick={onNewExhibit}
              className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              新規出品
            </button>
          )}
        </div>
      </div>

      {listedProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          {status === "下書き" ? "下書きはまだありません。" : "該当する出品がありません。"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-auto border-collapse text-sm text-slate-800">
            <colgroup>
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[200px]" />
              <col className="w-[120px]" />
              <col className="w-[220px]" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[180px]" />
              <col className="w-[210px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">更新日</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">状況</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">前設置</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">メーカー</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">機種名</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">台数</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">売却数</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">残数</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">商品価</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">撤去日</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">備考</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {listedProducts.map((product, idx) => {
                const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                const soldCount = 0;
                const remainingCount = product.quantity - soldCount;

                return (
                  <tr key={product.id} className={`${zebra} border-b border-slate-100 text-sm`}>
                    <td className="whitespace-nowrap px-3 py-2 align-top">{product.updatedAt}</td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                          statusBadgeStyles[product.status] ?? "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-semibold text-slate-800">{product.prefecture}</div>
                      <div className="text-xs text-slate-500">{product.sellerName}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top">{product.maker}</td>
                    <td className="px-3 py-2 align-top">
                      <Link
                        href={`/products/${product.id}`}
                        className="block max-w-full text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-right font-semibold tabular-nums">
                      {product.quantity}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-right tabular-nums">{soldCount}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-right tabular-nums">{remainingCount}</td>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-right font-semibold tabular-nums">
                      {currencyFormatter.format(product.price)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      <div className="font-semibold text-slate-800">{product.removalDate}</div>
                      <div className="text-xs text-slate-500">{product.removalStatus ?? "撤去状況未設定"}</div>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">{product.note ?? "-"}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col items-start gap-1 text-xs">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            className="rounded border border-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleCreateNaviFromListing(product)}
                          >
                            取引Navi
                          </button>
                          <button className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50">
                            編集
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <button className="px-1 py-0.5 text-[11px] text-slate-500 hover:text-slate-700">取り下げ</button>
                          <button className="px-1 py-0.5 text-[11px] text-rose-600 hover:text-rose-700">削除</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
