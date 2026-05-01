"use client";

import { useState } from "react";

const MACHINE_INFO = {
  maker: "SANKYO",
  model: "Pフィーバー 機動戦士ガンダムユニコーン2",
  frameColor: "赤",
  location: "埼玉倉庫 B-11",
  condition: "動作良好（役物・液晶確認済み）",
  listingStatus: "未出品",
  history: "2026-04-21 購入 / 2026-04-22 受入検品完了",
};

export default function QrDemoPage() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">QR読取デモ</h1>
          <p className="mt-3 text-sm text-slate-600">実カメラ連携なしで、QR読取後の機械情報表示フローを営業向けに再現します。</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => setVisible(true)}
            className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            QRを読み取る
          </button>

          {visible ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-base font-semibold text-slate-900">機械情報カード</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt className="text-slate-500">メーカー</dt><dd>{MACHINE_INFO.maker}</dd></div>
                <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt className="text-slate-500">機種名</dt><dd className="text-right">{MACHINE_INFO.model}</dd></div>
                <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt className="text-slate-500">枠色</dt><dd>{MACHINE_INFO.frameColor}</dd></div>
                <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt className="text-slate-500">保管場所</dt><dd>{MACHINE_INFO.location}</dd></div>
                <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt className="text-slate-500">状態</dt><dd className="text-right">{MACHINE_INFO.condition}</dd></div>
                <div className="flex justify-between gap-4 border-b border-slate-200 pb-2"><dt className="text-slate-500">出品状況</dt><dd>{MACHINE_INFO.listingStatus}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">取引履歴</dt><dd className="text-right">{MACHINE_INFO.history}</dd></div>
              </dl>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
