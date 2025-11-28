"use client";

import { DummyHistoryTable } from "./DummyHistoryTable";

export function SalesHistoryTabContent() {
  return (
    <section className="space-y-4">
      <TransactionIntro message="ここに「売却履歴」の一覧テーブルを表示する予定です。現状は /mypage/dealings/sales と同等の情報を想定しています。" />
      <DummyHistoryTable kind="sales" />
    </section>
  );
}

function TransactionIntro({ message }: { message: string }) {
  return <p className="text-sm text-slate-600">{message}</p>;
}
