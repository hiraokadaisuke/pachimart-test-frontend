import Link from "next/link";
import { redirect } from "next/navigation";
import { completeOutboundSchedule, getOutboundScheduleById } from "@/features/inventory/server";
import { WorkClient } from "./WorkClient";

export default async function OutboundWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await getOutboundScheduleById(id);
  if (!schedule) return <div className="p-4">Not found</div>;
  const scheduleId = schedule.id;
  const unit = schedule.inventoryUnits[0] ?? null;
  const completed = ["SHIPPED", "DELIVERED"].includes(schedule.status);

  async function completeAction() {
    "use server";
    await completeOutboundSchedule(scheduleId);
    redirect(`/inventory/outbound/${scheduleId}/work`);
  }

  return <div className="mx-auto max-w-md px-3 py-4 space-y-3"><h1 className="text-xl font-bold">出庫作業</h1>
    <div className="rounded border bg-white p-3 text-sm space-y-1"><p>予定ID: {schedule.id}</p><p>機種: {schedule.modelNameSnapshot}</p><p>予定日: {schedule.expectedDate.toISOString().slice(0,10)}</p><p>販売先: {schedule.buyerName ?? "-"}</p><p>状態: {schedule.status}</p></div>
    <div className="rounded border bg-white p-3 text-sm space-y-1"><p className="font-semibold">対象Unit</p><p>displayCode: {unit?.displayCode ?? "-"}</p><p>本体番号: {unit?.bodySerialNumber ?? "-"}</p><p>枠番号: {unit?.frameSerialNumber ?? "-"}</p><p>主基板番号: {unit?.mainBoardSerialNumber ?? "-"}</p><p>rawQr: {unit?.rawQr ?? "-"}</p><p>動確: {unit?.operationCheckStatus ?? "-"}</p><p>ガラス: {unit?.glassStatus ?? "-"}</p><p>釘シート: {unit?.nailSheetStatus ?? "-"}</p><p>検品: {unit?.inspectionStatus ?? "-"}</p><p>メモ: {unit?.memo ?? "-"}</p><p>保管先: {unit?.storageLocationId ?? "-"}</p></div>
    {completed ? <p className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">完了済みです。</p> : <WorkClient unitDisplayCode={unit?.displayCode ?? null} unitRawQr={unit?.rawQr ?? null} canComplete={!completed && schedule.status !== "CANCELED"} completeAction={completeAction} />}
    <div className="flex gap-3 text-sm"><Link className="underline" href={`/inventory/outbound/${scheduleId}`}>詳細へ戻る</Link><Link className="underline" href="/inventory/outbound">一覧へ戻る</Link></div>
  </div>;
}
