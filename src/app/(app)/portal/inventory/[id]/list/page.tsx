"use client";

import { useState } from "react";

type Props = {
  params: {
    id: string;
  };
};

export default function InventoryListDemoPage({ params }: Props) {
  const [listed, setListed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">在庫からパチマートへ出品</h1>
          <p className="mt-3 text-sm text-slate-600">在庫ID: {params.id} の機械をパチマートへ出品する営業デモ用フォームです。</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">出品台数</span>
              <input defaultValue="3" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">販売価格（1台あたり）</span>
              <input defaultValue="225000" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">送料</span>
              <select defaultValue="着払い" className="w-full rounded-md border border-slate-300 px-3 py-2">
                <option>着払い</option>
                <option>出品者負担</option>
                <option>要相談</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">回答期限</span>
              <input type="date" defaultValue="2026-05-15" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">備考</span>
              <textarea
                defaultValue="セル・役物ともに動作確認済み。状態は良好です。"
                className="h-24 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setListed(true)}
            className="mt-6 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            出品する
          </button>

          {listed ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              出品が完了しました。パチマート上で公開中です。（デモ表示）
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
