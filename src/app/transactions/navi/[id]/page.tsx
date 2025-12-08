"use client";

import { useParams } from "next/navigation";

import { StatusBadge } from "@/components/transactions/StatusBadge";

export default function TransactionDetailPage() {
  const params = useParams<{ id?: string }>();
  const naviId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">取引詳細</h1>
        <p className="text-sm text-neutral-800">
          この画面では取引の内容を確認できます。※ダミーデータです
        </p>
      </header>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold">基本情報</h2>
        <div className="text-sm text-neutral-800 space-y-1">
          <p>取引ID：{naviId ?? "NAVI-000000"}</p>
          <p>案件名：パチンコ機器の売買（サンプル）</p>
          <p>相手先：株式会社ダミー商事</p>
        </div>
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold">ステータス</h2>
        <StatusBadge statusKey="navi_in_progress" />
      </section>

      <section className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold">金額サマリー</h2>
        <div className="space-y-1 text-sm text-neutral-800">
          <p>商品代金：¥1,200,000</p>
          <p>送料：¥30,000</p>
          <p>手数料：¥10,000</p>
          <p className="font-semibold text-slate-800">税込合計：¥1,320,000</p>
        </div>
      </section>
    </div>
  );
}
