"use client";

import { DummyHistoryTable } from "./DummyHistoryTable";

export function SalesHistoryTabContent() {
  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">
        ここに「売却履歴」の一覧テーブルを表示する予定です。現状は /mypage/dealings/sales と同等の情報を想定しています。
      </p>
      <DummyHistoryTable kind="sales" />
    </section>
  );
}
