import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { formatQuantity, inboundStatusLabel } from "@/features/inventory/labels";
import { getAutoCreatedInboundInfo } from "@/features/inventory/inbound-auto";
import {
  cancelCompletedInboundSchedule,
  cancelInboundSchedule,
  completeInboundSchedule,
  getInboundScheduleSummary,
  getInboundSchedules,
} from "@/features/inventory/server";

type FilterType = "all" | "destination-missing";

function isDestinationMissingOpenSchedule(schedule: { destinationLocationId: string | null; status: string }) {
  return schedule.destinationLocationId === null && schedule.status !== "RECEIVED" && schedule.status !== "CANCELED";
}

export default async function InboundSchedulesPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const [schedules, summary, params] = await Promise.all([getInboundSchedules(), getInboundScheduleSummary(), searchParams]);
  const filter: FilterType = params?.filter === "destination-missing" ? "destination-missing" : "all";

  const destinationMissingCount = schedules.filter((schedule: (typeof schedules)[number]) => isDestinationMissingOpenSchedule(schedule)).length;
  const filteredSchedules =
    filter === "destination-missing"
      ? schedules.filter((schedule: (typeof schedules)[number]) => isDestinationMissingOpenSchedule(schedule))
      : schedules;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-3 py-3 md:px-5">
      <InventoryTabs />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-900">入庫予定</h1>
        <p className="text-xs text-slate-600">入庫先未設定 {destinationMissingCount}件 / 全{schedules.length}件</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          href="/inventory/inbound"
          className={`rounded-sm border px-2.5 py-1 text-xs ${
            filter === "all" ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          全て
        </Link>
        <Link
          href="/inventory/inbound?filter=destination-missing"
          className={`rounded-sm border px-2.5 py-1 text-xs ${
            filter === "destination-missing"
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          入庫先未設定のみ（{destinationMissingCount}）
        </Link>
      </div>
      <div className="mt-2">
        <Link href="/inventory/inbound/new" className="inline-flex items-center rounded-sm border border-emerald-700 bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
          入庫予定を登録
        </Link>
      </div>
      <div className="mt-2 grid gap-1 sm:grid-cols-3">
        <InventorySummaryCard label="予定" value={`${schedules.length}件`} />
        <InventorySummaryCard label="入庫待ち" value={`${summary.ARRIVAL_WAITING?.count ?? 0}件`} />
        <InventorySummaryCard label="一部入庫" value={`${summary.PARTIALLY_RECEIVED?.count ?? 0}件`} />
      </div>
      <div className="mt-2 overflow-x-auto rounded border border-slate-300 bg-white">
        <div className="flex min-w-[1200px] items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-xs">
          <div className="font-semibold text-slate-700">表示: {filteredSchedules.length}件</div>
        </div>
        <table className="min-w-[1200px] w-full text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {["入庫予定日", "ステータス", "由来", "取引先", "機種名", "台数", "進捗", "入庫先", "備考", "操作"].map((h) => (
                <th key={h} className="whitespace-nowrap border-r border-slate-200 px-2 py-1.5 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((s: (typeof filteredSchedules)[number]) => {
              const autoCreated = getAutoCreatedInboundInfo({ sourceType: s.sourceType, sourceId: s.sourceId, note: s.note });
              const destinationMissing = !s.destinationLocationId;
              const isOpenSchedule = s.status !== "RECEIVED" && s.status !== "CANCELED";
              const needsDestinationSetup = destinationMissing && isOpenSchedule;
              return <tr key={s.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-2 py-1.5 whitespace-nowrap">{s.expectedDate.toISOString().slice(0, 10)}</td>
                <td className="px-2 py-1.5"><InventoryStatusBadge status={inboundStatusLabel(s.status)} /></td>
                <td className="px-2 py-1.5">{s.sourceType ?? "MANUAL"}</td>
                <td className="px-2 py-1.5">{s.supplierName ?? "-"}</td>
                <td className="px-2 py-1.5 font-medium">{s.modelNameSnapshot}</td>
                <td className="px-2 py-1.5">{formatQuantity(s.quantity)}</td>
                <td className="px-2 py-1.5 text-[11px]">
                  <div>Unit {s.inventoryUnits.length}/{s.quantity}</div>
                  <div>QR {s.inventoryUnits.filter((u)=>u.rawQr).length}/{s.quantity}</div>
                  <div>番号 {s.inventoryUnits.filter((u)=>u.displayCode).length}/{s.quantity}</div>
                  <div>動確 {s.inventoryUnits.filter((u)=>(u.memo??"").includes("動確済")).length}/{s.quantity}</div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="space-y-1">
                    <span>{s.destinationLocation?.name ?? "-"}</span>
                    {destinationMissing ? (
                      <div className="space-y-1">
                        <span className="inline-flex rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">入庫先未設定</span>
                        {needsDestinationSetup ? (
                          <div>
                            <Link href={`/inventory/inbound/${s.id}/edit`} className="text-xs text-blue-700 underline underline-offset-2 hover:text-blue-800">
                              入庫先を設定する
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="space-y-1">
                    {autoCreated.isAutoCreated ? (
                      <div className="space-y-1">
                        <span className="inline-flex rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">取引から自動作成</span>
                        {autoCreated.sourceType ? <p className="text-[11px] text-slate-600">Source: {autoCreated.sourceType} / Source ID: {autoCreated.sourceId ?? "-"}</p> : null}
                        {autoCreated.dealingId ? <p className="text-[11px] text-slate-600">Dealing ID: {autoCreated.dealingId}</p> : null}
                        {autoCreated.isLegacyNoteBased ? <p className="text-[11px] text-amber-700">旧形式(note判定)</p> : null}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  {s.status === "RECEIVED" ? (
                    <div className="flex items-center gap-2">
                      <form action={async () => {"use server"; await cancelCompletedInboundSchedule(s.id); redirect("/inventory/inbound");}}>
                        <Button type="submit" variant="outline">入庫済みを取消</Button>
                      </form>
                      <span className="text-xs text-amber-700">在庫を減算します</span>
                    </div>
                  ) : s.status === "CANCELED" ? (
                    <span className="text-xs font-medium text-slate-500">取消済</span>
                  ) : (
                    <div className="flex gap-2">
                      <Link href={`/inventory/inbound/${s.id}/edit`} className="text-xs underline">編集</Link>
                      {needsDestinationSetup ? <span className="text-xs text-red-700">入庫先未設定のため完了できません</span> : null}
                      <Link href={`/inventory/inbounds/${s.id}`} className="text-xs underline">詳細</Link>
                      <Link href={`/inventory/inbounds/${s.id}/work`} className="text-xs underline">作業</Link>
                      <form action={async () => {"use server"; await cancelInboundSchedule(s.id); redirect("/inventory/inbound");}}>
                        <Button type="submit" variant="outline">取消する</Button>
                      </form>
                      <form action={async () => {"use server"; await completeInboundSchedule(s.id); redirect("/inventory/inbound");}}>
                        <Button type="submit" disabled={destinationMissing} title={destinationMissing ? "入庫先を設定してください" : undefined}>入庫完了</Button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
