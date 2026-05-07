import Link from "next/link";
import { outboundStatusLabel } from "@/features/inventory/labels";
import { getOutboundSchedules } from "@/features/inventory/server";

export default async function OutboundMobilePage() {
  const schedules = await getOutboundSchedules();
  const toDate = (value: Date | null | undefined) => (value instanceof Date ? value.toISOString().slice(0, 10) : "-");
  const toStatusLabel = (value: string | null | undefined) => {
    if (!value) return "不明";
    try {
      return outboundStatusLabel(value as never);
    } catch {
      return value;
    }
  };
  return <div className="mx-auto max-w-md px-3 py-4 space-y-3"><h1 className="text-xl font-bold">発送予定（モバイル）</h1>
    {schedules.length === 0 ? <div className="rounded border bg-white p-4 text-sm">出庫予定がありません。販売伝票から出庫予定を作成できます。</div> : null}
    {schedules.map((s)=>{ const unit=s.inventoryUnits?.[0];
      return <div key={s.id} className="rounded border bg-white p-3 text-sm space-y-1"><p className="text-base font-semibold">{s.modelNameSnapshot}</p><p>{s.quantity}台</p><p>Unit: {unit?.displayCode ?? "-"}</p><p>QR: {unit?.rawQr ?? "-"}</p><p>保管先: {unit?.storageLocationId ?? s.originLocation?.name ?? "-"}</p><p>販売先: {s.buyerName ?? "-"}</p><p>出庫予定: {toDate(s.expectedDate)}</p><p>状態: {toStatusLabel(s.status)}</p><p>照合: {unit?.displayCode ? "未照合" : "Unit未紐づき"}</p><Link href={`/inventory/outbound/${s.id}/work`} className="inline-block mt-1 rounded bg-slate-900 px-3 py-1 text-white">出庫作業</Link></div>
    })}
  </div>;
}
