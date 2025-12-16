"use client";

import { useState } from "react";

export function WithdrawRequestTabContent() {
  const [amount, setAmount] = useState(300000);
  const [note, setNote] = useState("テスト出金のモックです");
  const [scheduledDate, setScheduledDate] = useState("2025-11-25");

  return (
    <section className="space-y-4 text-neutral-900">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">出金申請</h2>
        <p className="text-sm text-neutral-700">
          出金申請のモックフォームです。入力内容は保存されませんが、今後の画面設計に向けた雛形として利用できます。
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-neutral-800">
              <span>出金希望額</span>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-neutral-800">
              <span>希望振込日</span>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="block space-y-1 text-sm font-medium text-neutral-800">
            <span>備考</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="振込口座や担当者へのメモを入力してください"
            />
          </label>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-neutral-700">
              ボタンを押しても実際の申請処理は行われません。送信フローの接続は別タスクで実装予定です。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-slate-100"
              >
                下書き保存（モック）
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                出金を申請する
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
