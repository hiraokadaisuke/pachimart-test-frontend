"use client";

import Link from "next/link";
import { useState } from "react";

type EstimateRow = {
  id: number;
  manufacturer: string;
  machineName: string;
  quantity: number;
  memo: string;
  listingLabel: string;
  status: "一致" | "未一致" | "確認中";
};

const estimateRows: EstimateRow[] = [
  {
    id: 1,
    manufacturer: "サミー",
    machineName: "P北斗無双",
    quantity: 5,
    memo: "再見積あり",
    listingLabel: "出品ページを見る",
    status: "一致",
  },
  {
    id: 2,
    manufacturer: "サンセイ",
    machineName: "P牙狼月虹ノ旅人",
    quantity: 2,
    memo: "-",
    listingLabel: "出品ページを見る",
    status: "一致",
  },
  {
    id: 3,
    manufacturer: "京楽",
    machineName: "P乃木坂46",
    quantity: 8,
    memo: "メモ確認",
    listingLabel: "出品ページを見る",
    status: "一致",
  },
  {
    id: 4,
    manufacturer: "平和",
    machineName: "Pルパン三世 2000カラットの涙",
    quantity: 3,
    memo: "型式確認中",
    listingLabel: "確認中",
    status: "未一致",
  },
];

const statusStyle: Record<EstimateRow["status"], string> = {
  一致: "border-emerald-200 bg-emerald-50 text-emerald-700",
  未一致: "border-amber-200 bg-amber-50 text-amber-700",
  確認中: "border-slate-300 bg-slate-100 text-slate-700",
};

function EstimateStartCards({ onOpenImportModal }: { onOpenImportModal: () => void }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">簡単見積り</h1>
        <p className="max-w-4xl text-sm leading-relaxed text-slate-600">
          複数機種の見積り前準備を、まとめて行うための画面です。機種選択またはファイル取込みから、見積り用の下書きを作成できます。
        </p>
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
          <h2 className="text-base font-semibold text-slate-900">機種を選んで作成</h2>
          <p className="mt-2 text-sm text-slate-600">パチマートの商品一覧から機種を選び、見積り下書きを作成します。</p>
          <Link
            href="/market/products"
            className="mt-4 inline-flex h-10 items-center rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            商品一覧から選ぶ
          </Link>
        </article>

        <article className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
          <h2 className="text-base font-semibold text-slate-900">ファイルを取り込んで作成</h2>
          <p className="mt-2 text-sm text-slate-600">Excel / CSV の一覧をもとに、見積り下書きを作成します。</p>
          <button
            type="button"
            onClick={onOpenImportModal}
            className="mt-4 inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Excel / CSV 取込み
          </button>
        </article>
      </div>

      <p className="mt-4 text-xs text-slate-500">※ 現在はUI確認用のテスト実装です。実際の保存・取込み処理は今後対応予定です。</p>
    </section>
  );
}

function EstimateDraftHeader() {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 md:flex-row md:items-start">
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-slate-900">見積り下書き詳細</h2>
        <dl className="grid gap-1 text-sm text-slate-600">
          <div className="flex gap-2">
            <dt className="font-medium text-slate-700">下書き名:</dt>
            <dd>2026-03-16 見積り下書き</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-slate-700">作成者:</dt>
            <dd>テストユーザー</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-slate-700">更新日:</dt>
            <dd>2026/03/16</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Excelに出力
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          CSVに出力
        </button>
      </div>
    </header>
  );
}

function EstimateDraftTable({ rows }: { rows: EstimateRow[] }) {
  return (
    <section className="space-y-3 px-5 pb-5 pt-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            行を追加
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            選択行を削除
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            下書き保存
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-blue-600 bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規掲載へ
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="w-12 border-b border-slate-200 px-3 py-2.5">
                <input type="checkbox" aria-label="すべて選択" className="h-4 w-4 rounded border-slate-300" />
              </th>
              <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">メーカー</th>
              <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">機種名</th>
              <th className="w-24 border-b border-slate-200 px-3 py-2.5 font-semibold">台数</th>
              <th className="border-b border-slate-200 px-3 py-2.5 font-semibold">メモ</th>
              <th className="w-40 border-b border-slate-200 px-3 py-2.5 font-semibold">出品ページ</th>
              <th className="w-28 border-b border-slate-200 px-3 py-2.5 font-semibold">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                <td className="px-3 py-2.5">
                  <input type="checkbox" aria-label={`${row.machineName}を選択`} className="h-4 w-4 rounded border-slate-300" />
                </td>
                <td className="px-3 py-2.5">{row.manufacturer}</td>
                <td className="px-3 py-2.5">
                  <button type="button" className="text-left text-blue-700 hover:text-blue-800 hover:underline">
                    {row.machineName}
                  </button>
                </td>
                <td className="px-3 py-2.5">{row.quantity}</td>
                <td className="px-3 py-2.5">{row.memo}</td>
                <td className="px-3 py-2.5">
                  <button type="button" className="text-blue-700 hover:text-blue-800 hover:underline">
                    {row.listingLabel}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EstimateImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 px-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Excel / CSV 取込み</h3>
        <p className="mt-2 text-sm text-slate-600">ExcelまたはCSVで機種リストをまとめて取り込みます。</p>

        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          ファイル選択（ダミー）
          <p className="mt-1 text-xs text-slate-500">.xlsx / .csv 形式のファイルを選択してください。</p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-blue-600 bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            取り込む
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EstimatePage() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-8 text-neutral-900">
      <EstimateStartCards onOpenImportModal={() => setIsImportModalOpen(true)} />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <EstimateDraftHeader />
        <EstimateDraftTable rows={estimateRows} />
      </section>

      <EstimateImportModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </main>
  );
}
