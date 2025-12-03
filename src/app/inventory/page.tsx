"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { mockInventories } from "@/lib/mockInventories";

const PAGE_SIZE = 100;
const clampPageNumber = (page: number, totalPages: number) => {
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, totalPages);
};

const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  return `¥${value.toLocaleString('ja-JP')}`;
};

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-700">読み込み中…</div>}>
      <InventoryPageContent />
    </Suspense>
  );
}

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const totalCount = mockInventories.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams?.get("page");
    const parsedPage = pageParam ? Number(pageParam) : 1;
    return clampPageNumber(parsedPage, totalPages);
  });

  useEffect(() => {
    const pageParam = searchParams?.get("page");
    const parsedPage = pageParam ? Number(pageParam) : 1;
    const nextPage = clampPageNumber(parsedPage, totalPages);
    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  }, [currentPage, searchParams, totalPages]);

  const pagedInventories = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return mockInventories.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage]);

  const startNumber = (currentPage - 1) * PAGE_SIZE + 1;
  const endNumber = Math.min(currentPage * PAGE_SIZE, totalCount);
  const pageSummary = useMemo(
    () => `${startNumber}–${endNumber} / ${totalCount}件`,
    [endNumber, startNumber, totalCount],
  );

  const updatePage = (page: number) => {
    const nextPage = clampPageNumber(page, totalPages);
    setCurrentPage(nextPage);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <section className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">在庫管理</h1>
          <p className="text-sm text-gray-500">1ページあたり100件で表示しています。</p>
        </div>
        <div className="text-sm text-gray-600">{pageSummary}</div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">種別</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">ステータス</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">メーカー</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">型式名</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">パネル</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">倉庫</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">購入金額</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">売却金額</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">ミス店舗</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {pagedInventories.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{item.id}</td>
                <td className="px-4 py-3 text-gray-700">{item.kind}</td>
                <td className="px-4 py-3 text-gray-700">{item.status}</td>
                <td className="px-4 py-3 text-gray-700">{item.maker}</td>
                <td className="px-4 py-3 text-gray-700">{item.modelName}</td>
                <td className="px-4 py-3 text-gray-700">{item.framePanel}</td>
                <td className="px-4 py-3 text-gray-700">{item.warehouse}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(item.purchasePrice)}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(item.sellPrice)}</td>
                <td className="px-4 py-3 text-gray-700">{item.missStore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-gray-600">{pageSummary}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            onClick={() => updatePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            前へ
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  pageNumber === currentPage
                    ? 'bg-blue-600 text-white shadow'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => updatePage(pageNumber)}
                disabled={pageNumber === currentPage}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            onClick={() => updatePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            次へ
          </button>
        </div>
      </div>
    </section>
  );
}
