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
      <h1 className="text-lg font-bold">在庫・倉庫 業務ダッシュボード</h1>
      <p className="mt-1 text-sm text-slate-600">在庫・入庫・出庫・棚卸を1画面で確認できます。販売伝票の本導線は /sales/sales-invoice です。</p>

      <div className="mt-2 grid gap-1 sm:grid-cols-4 lg:grid-cols-8">
        <InventorySummaryCard label="在庫Unit数" value={`${summary.totalUnitCount}台`} />
        <InventorySummaryCard label="在庫中Unit数" value={`${summary.inStockUnitCount}台`} />
        <InventorySummaryCard label="予約中Unit数" value={`${summary.reservedUnitCount}台`} />
        <InventorySummaryCard label="出庫済Unit数" value={`${summary.shippedUnitCount}台`} />
        <InventorySummaryCard label="入庫予定件数" value={`${summary.inboundOpenCount}件`} />
        <InventorySummaryCard label="出庫予定件数" value={`${summary.outboundOpenCount}件`} />
        <InventorySummaryCard label="棚卸中件数" value={`${summary.stocktakeInProgressCount}件`} />
        <InventorySummaryCard label="要確認件数" value={`${summary.requiresAttentionCount}件`} />
      </div>

      <InventorySectionCard title="主要業務導線" className="mt-3" description="業務OSとして、ここから各画面へ移動します。">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {[["在庫一覧", "/inventory/items"], ["入庫予定", "/inventory/inbound"], ["出庫予定", "/inventory/outbound"], ["棚卸", "/inventory/stocktakes"], ["QRスキャン", "/inventory/units/scan"], ["設定", "/inventory/settings"]].map(([label, href]) => (
            <Link key={String(href)} href={String(href)} className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-sky-100">{label}</Link>
          ))}
        </div>
      </InventorySectionCard>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
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

      <InventorySectionCard title="デモで見る業務フロー" className="mt-3" description="実運用の流れに沿って主要画面を確認できます。">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded border border-slate-300 bg-white p-2 text-xs"><p className="font-semibold">1. 入庫作業</p><p className="text-slate-600">入庫作業では1台ずつ番号・QR・動作確認を登録します。</p><div className="mt-2 space-x-3"><Link className="underline" href="/inventory/inbound">入庫予定一覧</Link><Link className="underline" href="/inventory/inbounds/mobile">スマホ入庫一覧</Link></div></div>
          <div className="rounded border border-slate-300 bg-white p-2 text-xs"><p className="font-semibold">2. 販売・出庫</p><p className="text-slate-600">販売伝票でUnitを選択し、倉庫の出庫予定へ反映できます。</p><div className="mt-2 space-x-3"><Link className="underline" href="/sales/sales-invoice/list">販売伝票一覧</Link><Link className="underline" href="/sales/sales-invoice/create">販売伝票作成</Link><Link className="underline" href="/inventory/outbound">出庫予定一覧</Link><Link className="underline" href="/inventory/outbound/mobile">スマホ出庫一覧</Link></div></div>
          <div className="rounded border border-slate-300 bg-white p-2 text-xs"><p className="font-semibold">3. 棚卸・現物照合</p><p className="text-slate-600">棚卸では現物番号・QRを読み取り、システム在庫との差異を確認します。</p><div className="mt-2 space-x-3"><Link className="underline" href="/inventory/stocktakes">棚卸一覧</Link><Link className="underline" href="/inventory/stocktakes/new">棚卸作成</Link></div></div>
          <div className="rounded border border-slate-300 bg-white p-2 text-xs"><p className="font-semibold">4. 個体台帳</p><p className="text-slate-600">1台ごとの番号・動確・検品・履歴を確認。</p><div className="mt-2 space-x-3"><Link className="underline" href="/inventory/items">在庫一覧</Link><Link className="underline" href="/inventory/units/scan">Unitスキャン</Link></div></div>
        </div>
      </InventorySectionCard>

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
