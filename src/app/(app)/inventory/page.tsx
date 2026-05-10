import Link from "next/link";

import { InventorySectionCard, InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { getInventoryActivityData, getInventoryDashboardSummary } from "@/features/inventory/server";

const toDate = (value: Date) => value.toISOString().slice(0, 10);

export default async function InventoryPage() {
  const [summary, activity] = await Promise.all([
    getInventoryDashboardSummary(),
    getInventoryActivityData({ typeFilter: "ALL", rangeFilter: "30D", page: 1, pageSize: 8, take: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-3 md:px-5">
      <InventoryTabs />
      <h1 className="text-lg font-bold">在庫ダッシュボード</h1>
      <p className="mt-0.5 text-xs text-slate-600">当日作業と未処理を優先表示します。販売伝票の本導線は /sales/sales-invoice です。</p>

      <div className="mt-2 grid gap-1 sm:grid-cols-4 lg:grid-cols-6">
        <InventorySummaryCard label="在庫Unit数" value={`${summary.totalUnitCount}台`} />
        <InventorySummaryCard label="在庫中Unit数" value={`${summary.inStockUnitCount}台`} />
        <InventorySummaryCard label="予約中Unit数" value={`${summary.reservedUnitCount}台`} />
        <InventorySummaryCard label="入庫予定件数" value={`${summary.inboundOpenCount}件`} />
        <InventorySummaryCard label="出庫予定件数" value={`${summary.outboundOpenCount}件`} />
        <InventorySummaryCard label="要確認件数" value={`${summary.requiresAttentionCount}件`} />
      </div>

      <InventorySectionCard title="主要業務導線" className="mt-2" description="日次業務の主要導線">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {[["在庫一覧", "/inventory/items"], ["入庫予定", "/inventory/inbound"], ["出庫予定", "/inventory/outbound"], ["棚卸", "/inventory/stocktakes"], ["QRスキャン", "/inventory/units/scan"], ["設定", "/inventory/settings"]].map(([label, href]) => (
            <Link key={String(href)} href={String(href)} className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-sky-100">{label}</Link>
          ))}
        </div>
      </InventorySectionCard>

      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        <InventorySectionCard title="今日/近日の作業" description="当日の優先作業を確認します。">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t"><td className="py-2">今日の入庫予定</td><td className="py-2 text-right font-semibold">{summary.todayInboundCount}件</td></tr>
              <tr className="border-t"><td className="py-2">今日の出庫予定</td><td className="py-2 text-right font-semibold">{summary.todayOutboundCount}件</td></tr>
              <tr className="border-t"><td className="py-2">進行中の棚卸</td><td className="py-2 text-right font-semibold">{summary.stocktakeInProgressCount}件</td></tr>
              <tr className="border-t"><td className="py-2">動確未完了Unit</td><td className="py-2 text-right font-semibold">{summary.operationCheckPendingUnitCount}台</td></tr>
              <tr className="border-t"><td className="py-2">番号未入力Unit</td><td className="py-2 text-right font-semibold">{summary.missingSerialUnitCount}台</td></tr>
            </tbody>
          </table>
        </InventorySectionCard>

        <InventorySectionCard title="販売連携ステータス" description="販売伝票から連携された出庫状況を確認します。">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-t"><td className="py-2">販売伝票由来の出庫予定件数</td><td className="py-2 text-right font-semibold">{summary.outboundFromSalesInvoiceCount}件</td></tr>
              <tr className="border-t"><td className="py-2">出庫予定未完了件数</td><td className="py-2 text-right font-semibold">{summary.outboundNotCompletedCount}件</td></tr>
            </tbody>
          </table>
          <div className="mt-3 flex gap-2 text-sm">
            <Link href="/sales/sales-invoice/list" className="rounded border px-3 py-1.5 hover:bg-slate-50">販売伝票一覧</Link>
            <Link href="/sales/sales-invoice/create" className="rounded border px-3 py-1.5 hover:bg-slate-50">販売伝票作成</Link>
          </div>
        </InventorySectionCard>
      </div>
      <InventorySectionCard title="スマホ向け作業ショートカット" className="mt-3" description="現場作業向け導線です。">
        <div className="grid gap-2 grid-cols-2 md:grid-cols-5 text-sm">
          <Link href="/inventory/inbounds/mobile" className="rounded border border-slate-300 bg-white p-2 text-center text-xs font-semibold">入庫作業</Link>
          <Link href="/inventory/outbound/mobile" className="rounded border border-slate-300 bg-white p-2 text-center text-xs font-semibold">出庫作業</Link>
          <Link href="/inventory/stocktakes" className="rounded border border-slate-300 bg-white p-2 text-center text-xs font-semibold">棚卸スキャン</Link>
          <Link href="/inventory/units/scan" className="rounded border border-slate-300 bg-white p-2 text-center text-xs font-semibold">QRスキャン</Link>
          <Link href="/inventory/items" className="rounded border border-slate-300 bg-white p-2 text-center text-xs font-semibold">Unit検索</Link>
        </div>
      </InventorySectionCard>

      <InventorySectionCard title="最近の在庫更新" className="mt-3">
        <ul className="divide-y rounded border bg-white">
          {activity.activities.slice(0, 8).map((a) => <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm"><div><p className="text-xs text-slate-500">{toDate(a.occurredAt)}</p><p className="font-semibold">{a.title}</p><p className="text-xs text-slate-600">{a.description}</p></div><Link href={a.href} className="text-xs underline">詳細</Link></li>)}
          {activity.activities.length === 0 ? <li className="px-3 py-4 text-sm text-slate-500">最近の在庫更新はありません。入庫・出庫・棚卸の作業後に更新されます。</li> : null}
        </ul>
      </InventorySectionCard>
    </div>
  );
}
