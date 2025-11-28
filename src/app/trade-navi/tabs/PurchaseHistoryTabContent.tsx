"use client";

import { DummyHistoryTable } from "./DummyHistoryTable";

export function PurchaseHistoryTabContent() {
  return (
    <section className="space-y-4">
      <TransactionIntro message="ここに「購入履歴」の一覧テーブルを表示する予定です。現状は /mypage/dealings/purchases と同等の情報を想定しています。" />
      <DummyHistoryTable kind="purchases" />
    </section>
  );
}

function TransactionIntro({ message }: { message: string }) {
  return <p className="text-sm text-slate-600">{message}</p>;
}
