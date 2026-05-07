import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, inventoryItemTypeLabel, outboundStatusLabel, shippingMethodLabel } from "@/features/inventory/labels";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-2xl font-bold">発送予定</h1>
      <div className="mt-4">
        <Link href="/inventory/outbound/new" className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">発送予定を登録</Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InventorySummaryCard label="発送予定件数" value={`${schedules.length}件`} />
        <InventorySummaryCard label="ピッキング中" value={`${summary.PICKING?.count ?? 0}件`} />
        <InventorySummaryCard label="発送準備中" value={`${summary.READY_TO_SHIP?.count ?? 0}件`} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["発送予定ID", "発送予定日", "販売先", "種別", "メーカー", "機種名", "台数", "出庫元", "発送方法", "由来", "ステータス", "操作"].map((h) => (
                <th key={h} className="px-3 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((s: (typeof schedules)[number]) => {
              const missingLink = !s.inventoryItemId;
              const autoCreated = getAutoCreatedOutboundInfo({ sourceType: s.sourceType, sourceId: s.sourceId, note: s.note });
              return (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.id}</td>
                  <td className="px-3 py-2">{s.expectedDate.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{s.buyerName ?? "-"}</td>
                  <td className="px-3 py-2">{inventoryItemTypeLabel(s.itemType)}</td>
                  <td className="px-3 py-2">{s.makerNameSnapshot ?? "-"}</td>
                  <td className="px-3 py-2">{s.modelNameSnapshot}</td>
                  <td className="px-3 py-2">{formatQuantity(s.quantity)}</td>
                  <td className="px-3 py-2">{s.originLocation?.name ?? "-"}</td>
                  <td className="px-3 py-2">{shippingMethodLabel(s.shippingMethod)}</td>
                  <td className="px-3 py-2 text-xs">
                    {s.sourceId?.startsWith("SV-") || s.sourceId?.startsWith("SH-") ? (
                      <div>
                        <div>販売伝票: {s.sourceId}</div>
                        <div>Unit: {s.inventoryUnits[0]?.displayCode ?? s.inventoryUnits[0]?.id ?? "-"}</div>
                        <div>QR: {s.inventoryUnits[0]?.rawQr ?? "-"}</div>
                      </div>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <InventoryStatusBadge status={outboundStatusLabel(s.status)} />
                      {autoCreated.isAutoCreated ? (
                        <div className="space-y-1">
                          <Badge variant="default">パチマート成約から自動作成</Badge>
                          {autoCreated.sourceType ? <p className="text-[11px] text-slate-600">Source: {autoCreated.sourceType} / Source ID: {autoCreated.sourceId ?? "-"}</p> : null}
                          {autoCreated.dealingId ? <p className="text-[11px] text-slate-600">Dealing ID: {autoCreated.dealingId}</p> : null}
                          {autoCreated.isLegacyNoteBased ? <p className="text-[11px] text-amber-700">旧形式(note判定)</p> : null}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {s.status === "CANCELED" ? (
                      <span className="text-xs font-medium text-slate-500">取消済</span>
                    ) : s.status === "SHIPPED" || s.status === "DELIVERED" ? (
                      <div className="flex items-center gap-2">
                        <form action={async () => {"use server"; await cancelCompletedOutboundSchedule(s.id); redirect("/inventory/outbound");}}>
                          <Button type="submit" variant="outline">発送済みを取消</Button>
                        </form>
                        <span className="text-xs text-amber-700">在庫を戻します</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link href={`/inventory/outbound/${s.id}/edit`} className="text-xs underline">編集</Link>
                        <form action={async () => {"use server"; await cancelOutboundSchedule(s.id); redirect("/inventory/outbound");}}>
                          <Button type="submit" variant="outline">取消する</Button>
                        </form>
                        <form action={async () => {"use server"; await completeOutboundSchedule(s.id); redirect("/inventory/outbound");}}>
                          <Button type="submit" disabled={missingLink}>発送完了</Button>
                        </form>
                        {missingLink ? <span className="text-xs text-amber-700">紐付け在庫なし</span> : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
