import { InventoryPlannedBadge, InventorySectionCard, InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatQuantity, inboundSchedules } from "@/features/inventory/mock";

export default function InboundPage() {
  const waiting = inboundSchedules.filter((s) => s.status === "入庫待ち").length;
  const partial = inboundSchedules.filter((s) => s.status === "一部入庫").length;
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">入庫予定一覧</h1>
    <InventorySectionCard title="この画面の役割" className="mt-4" description="パチマートで購入した物件を入庫予定へ反映し、在庫化までの倉庫業務を管理します。">
      <p className="text-sm text-slate-700">購入伝票と入庫予定をつなぐことで、Excelへの二重入力を減らす想定です。</p>
    </InventorySectionCard>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><InventorySummaryCard label="入庫予定件数" value={`${inboundSchedules.length}件`} /><InventorySummaryCard label="入庫待ち" value={`${waiting}件`} /><InventorySummaryCard label="一部入庫" value={`${partial}件`} /></div>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[980px] w-full text-sm"><thead className="bg-slate-50"><tr>{["入庫予定ID", "入庫予定日", "取引先", "種別", "メーカー", "機種名", "台数", "入庫先", "ステータス", "操作"].map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{inboundSchedules.map((s) => <tr key={s.id} className="border-t"><td className="px-3 py-2">{s.id}</td><td className="px-3 py-2">{s.expectedDate}</td><td className="px-3 py-2">{s.supplier}</td><td className="px-3 py-2">{s.type}</td><td className="px-3 py-2">{s.manufacturer}</td><td className="px-3 py-2">{s.modelName}</td><td className="px-3 py-2">{formatQuantity(s.quantity)}</td><td className="px-3 py-2">{s.destination}</td><td className="px-3 py-2"><InventoryStatusBadge status={s.status} /></td><td className="px-3 py-2"><div className="flex items-center gap-2"><Button disabled>入庫完了</Button><InventoryPlannedBadge label="STEP2以降で実装予定" /></div></td></tr>)}</tbody></table></div></div>;
}
