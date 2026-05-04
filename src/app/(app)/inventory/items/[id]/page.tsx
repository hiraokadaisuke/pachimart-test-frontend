import Link from "next/link";
import { notFound } from "next/navigation";

import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatQuantity, inventoryItems, itemActivities } from "@/features/inventory/mock";

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
  const item = inventoryItems.find((row) => row.id === params.id);
  if (!item) notFound();
  const activities = itemActivities[item.id] ?? ["2026-04-25 購入伝票作成", "2026-04-28 倉庫へ入庫"];
  const margin = item.plannedSalePrice - item.purchasePrice;

  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><Link href="/inventory/items" className="text-sm text-blue-600 underline">← 在庫一覧へ戻る</Link>
    <h1 className="mt-3 text-2xl font-bold">在庫詳細 {item.id}</h1>
    <div className="mt-5 grid gap-3 rounded-lg border bg-white p-5 text-sm md:grid-cols-2">{[["在庫ID",item.id],["メーカー",item.manufacturer],["機種名",item.modelName],["種別",item.type],["枠色",item.frameColor],["台数",formatQuantity(item.quantity)],["保管場所",item.storageLocation],["仕入価格",formatCurrency(item.purchasePrice)],["販売予定価格",formatCurrency(item.plannedSalePrice)],["粗利見込み",formatCurrency(margin)],["備考",item.notes]].map(([k,v])=><div key={k}><p className="text-slate-500">{k}</p><p className="font-medium">{v}</p></div>)}<div><p className="text-slate-500">ステータス</p><InventoryStatusBadge status={item.status} /></div><div><p className="text-slate-500">出品状態</p><InventoryStatusBadge status={item.listingStatus} /></div></div>
    <div className="mt-5 rounded-lg border bg-white p-5"><h2 className="font-semibold">関連する動き</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{activities.map((a)=><li key={a}>{a}</li>)}</ul></div>
    <div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled>パチマートに出品する</Button><p className="text-xs text-slate-500">STEP 2以降で、在庫情報を出品フォームへ引き継ぐ予定です。</p></div>
  </div>;
}
