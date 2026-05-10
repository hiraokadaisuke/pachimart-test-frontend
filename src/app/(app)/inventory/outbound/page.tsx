import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, outboundStatusLabel, shippingMethodLabel } from "@/features/inventory/labels";
import {
  cancelCompletedOutboundSchedule,
  cancelOutboundSchedule,
  completeOutboundSchedule,
  getOutboundScheduleSummary,
  getOutboundSchedules,
} from "@/features/inventory/server";
import { getAutoCreatedOutboundInfo } from "@/features/inventory/outbound-auto";

export default async function OutboundSchedulesPage() {
  const [schedules, summary] = await Promise.all([getOutboundSchedules(), getOutboundScheduleSummary()]);
  const toDate = (value: Date | null | undefined) => (value instanceof Date ? value.toISOString().slice(0, 10) : "-");
  const toStatusLabel = (value: string | null | undefined) => {
    if (!value) return "不明";
    try {
      return outboundStatusLabel(value as never);
    } catch {
      return value;
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-3 md:px-5">
      <InventoryTabs />
      <h1 className="text-lg font-bold">出庫予定</h1>
      <div className="mt-2">
        <Link href="/inventory/outbound/new" className="inline-flex items-center rounded-sm border border-emerald-700 bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800">出庫予定を登録</Link>
      </div>
      <div className="mt-2 grid gap-1 sm:grid-cols-3">
        <InventorySummaryCard label="予定" value={`${schedules.length}件`} />
        <InventorySummaryCard label="ピッキング中" value={`${summary.PICKING?.count ?? 0}件`} />
        <InventorySummaryCard label="出庫準備中" value={`${summary.READY_TO_SHIP?.count ?? 0}件`} />
      </div>
      <div className="mt-2 overflow-x-auto rounded border border-slate-300 bg-white">
        <div className="flex min-w-[1100px] items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-xs"><div className="font-semibold text-slate-700">表示: {schedules.length}件</div></div>
        <table className="min-w-[1100px] w-full text-xs">
          <thead className="bg-slate-100">
            <tr>
              {["予定日", "ステータス", "由来", "販売伝票ID", "販売先/買主", "機種名", "台数", "Unit番号", "QR(補助)", "保管先", "出庫方法", "運送会社", "備考", "リンク", "操作"].map((h) => (
                <th key={h} className="border-r border-slate-200 px-2 py-1.5 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s: (typeof schedules)[number]) => {
              const missingLink = !s.inventoryItemId;
              const salesDerived = s.sourceId?.startsWith("SV-") || s.sourceId?.startsWith("SH-");
              const autoCreated = getAutoCreatedOutboundInfo({ sourceType: s.sourceType, sourceId: s.sourceId, note: s.note });
              return (
                <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-2 py-1 whitespace-nowrap">{toDate(s.expectedDate)}</td>
                  <td className="px-2 py-1"><InventoryStatusBadge status={toStatusLabel(s.status)} /></td>
                  <td className="px-2 py-1 text-xs">{salesDerived ? "販売伝票" : autoCreated.isAutoCreated ? "取引" : "手動"}</td>
                  <td className="px-2 py-1">{salesDerived ? s.sourceId : "-"}</td>
                  <td className="px-2 py-1">{s.buyerName ?? "-"}</td>
                  <td className="px-2 py-1">{s.modelNameSnapshot}</td>
                  <td className="px-2 py-1">{formatQuantity(s.quantity)}</td>
                  <td className="px-2 py-1">{s.inventoryUnits?.[0]?.displayCode ?? "-"}</td>
                  <td className="px-2 py-1">{s.inventoryUnits?.[0]?.rawQr ?? "-"}</td>
                  <td className="px-2 py-1">{s.originLocation?.name ?? s.inventoryUnits?.[0]?.storageLocationId ?? "-"}</td>
                  <td className="px-2 py-1">{shippingMethodLabel(s.shippingMethod)}</td>
                  <td className="px-2 py-1">-</td>
                  <td className="px-2 py-1 max-w-[220px] truncate" title={s.note ?? undefined}>{s.note ?? "-"}</td>
                  <td className="px-2 py-1 text-xs"><div className="flex gap-2"><Link href={`/inventory/outbound/${s.id}`} className="underline">詳細</Link><Link href={`/inventory/outbound/${s.id}/work`} className="underline">作業</Link></div></td>
                  <td className="px-2 py-1">
                    {s.status === "CANCELED" ? (
                      <span className="text-xs font-medium text-slate-500">取消済</span>
                    ) : s.status === "SHIPPED" || s.status === "DELIVERED" ? (
                      <div className="flex items-center gap-2">
                        <form action={async () => {"use server"; await cancelCompletedOutboundSchedule(s.id); redirect("/inventory/outbound");}}>
                          <Button type="submit" variant="outline">出庫済みを取消</Button>
                        </form>
                        <span className="text-xs text-amber-700">在庫を戻します</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link href={`/inventory/outbound/${s.id}/edit`} className="text-xs underline">編集</Link>
                        <form action={async () => {"use server"; await cancelOutboundSchedule(s.id); redirect("/inventory/outbound");}}>
                          <Button type="submit" variant="outline" className="h-7 px-2 text-xs">取消する</Button>
                        </form>
                        <form action={async () => {"use server"; await completeOutboundSchedule(s.id); redirect("/inventory/outbound");}}>
                          <Button type="submit" disabled={missingLink} className="h-7 px-2 text-xs">出庫完了</Button>
                        </form>
                        {missingLink ? <span className="text-xs text-amber-700">紐付け在庫なし</span> : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          {schedules.length===0 ? <tr><td colSpan={15} className="px-3 py-8 text-center text-slate-500">出庫予定はありません。販売伝票から出庫予定を作成できます。</td></tr> : null}</tbody>
        </table>
      </div>
    </div>
  );
}
