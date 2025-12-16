"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { products } from "@/lib/dummyData";
import type { Product } from "@/types/product";
import { useCurrentDevUser } from "@/lib/dev-user/DevUserContext";

function formatPrefecture(prefecture: string) {
  if (prefecture === "北海道") return "北海道";
  return prefecture.replace(/(都|府|県)$/u, "");
}

function formatMonthDay(dateString: string | undefined) {
  if (!dateString) return "";
  const match = dateString.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!match) return "";

  const [, , month, day] = match;
  return `${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
}

function getRemovalDisplay(removalStatus: Product["removalStatus"], removalDate?: string) {
  if (removalStatus === "撤去済") return "撤去済";

  const formattedDate = formatMonthDay(removalDate);
  if (formattedDate) return `先撤去：${formattedDate}`;
  return "未定";
}

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
  const currentUser = useCurrentDevUser();
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
    return products.filter((product) => product.ownerUserId === currentUser.id).filter((product) => {
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
  }, [appliedFilters, currentUser.id]);

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
    const params = new URLSearchParams({
      productId: product.id.toString(),
      quantity: "1",
      unitPrice: product.price.toString(),
      productName: product.name,
      makerName: product.maker,
    });

    if (product.prefecture) {
      params.set("location", product.prefecture);
    }

    router.push(`/transactions/navi/${product.id}/edit?${params.toString()}`);
  };

  const totalCount = listedProducts.length;

  return (
    <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen space-y-4 text-xs sm:text-sm px-4 md:px-6 xl:px-8">
      <div className="mb-2 flex items-center justify-between text-xs sm:text-sm">
        <div className="text-xs text-neutral-700 sm:text-sm">全件数：{totalCount}件</div>
        <div />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md bg-slate-50 px-4 py-3">
        <div className="flex flex-col">{/* メーカー */}
          <label className="mb-1 block text-xs font-semibold text-neutral-800">メーカー</label>
          <select
            value={draftFilters.maker}
            onChange={(event) => setDraftFilters({ ...draftFilters, maker: event.target.value })}
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          >
            <option value="">すべて</option>
            {Array.from(new Set(products.filter((product) => product.ownerUserId === currentUser.id).map((product) => product.maker))
              ).map((maker) => (
              <option key={maker} value={maker}>
                {maker}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">{/* 機種名 */}
          <label className="mb-1 block text-xs font-semibold text-neutral-800">機種名</label>
          <input
            type="search"
            value={draftFilters.model}
            onChange={(event) => setDraftFilters({ ...draftFilters, model: event.target.value })}
            placeholder="機種名で検索"
            className="h-8 rounded-md border border-slate-300 px-2 text-sm"
          />
        </div>
        <div className="flex flex-col sm:min-w-[220px]">{/* 備考キーワード */}
          <label className="mb-1 block text-xs font-semibold text-neutral-800">備考</label>
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
            className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-neutral-900 transition hover:bg-slate-100"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-neutral-900 transition hover:bg-slate-100"
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
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-neutral-800">
          {status === "下書き" ? "下書きはまだありません。" : "該当する出品がありません。"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-auto border-collapse text-sm text-slate-800">
            <colgroup>
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[140px]" />
              <col className="w-[120px]" />
              <col className="w-[220px]" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[180px]" />
              <col className="w-[150px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">更新日</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">状況</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">前設置</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">メーカー</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">機種名</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-700">台数</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-700">売却数</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-700">残数</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-700">商品価</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">撤去日</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700">備考</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-neutral-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {listedProducts.map((product, idx) => {
                const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                const soldCount = 0;
                const remainingCount = product.quantity - soldCount;
                const removalDisplay = getRemovalDisplay(product.removalStatus, product.removalDate);

                return (
                  <tr key={product.id} className={`${zebra} border-b border-slate-100 text-sm`}>
                    <td className="whitespace-nowrap px-3 py-2 align-top">{product.updatedAt}</td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                          statusBadgeStyles[product.status] ?? "bg-slate-100 text-neutral-900 border border-slate-200"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top font-semibold text-slate-800">
                      {formatPrefecture(product.prefecture)}
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
                    <td className="whitespace-nowrap px-3 py-2 align-top font-semibold text-slate-800">{removalDisplay}</td>
                    <td className="px-3 py-2 align-top text-neutral-900">{product.note ?? "-"}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          className="rounded border border-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleCreateNaviFromListing(product)}
                        >
                          取引Navi
                        </button>
                        <ActionMenu />
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

function ActionMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-7 w-8 items-center justify-center rounded border border-slate-300 text-lg leading-none text-slate-700 transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ︙
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-36 rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[13px] font-semibold text-neutral-800 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            編集
          </button>
          <div className="my-1 border-t border-slate-200" />
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[13px] text-neutral-800 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            取り下げ
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
            onClick={() => setOpen(false)}
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
