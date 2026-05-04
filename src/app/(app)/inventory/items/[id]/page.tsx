import type { InventoryMovement } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InventoryPlannedBadge, InventorySectionCard, InventoryTimeline } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatQuantity, inventoryListingStatusLabel, inventoryMovementStatusLabel, inventoryMovementTypeLabel, inventoryStatusLabel } from "@/features/inventory/labels";
import { getInventoryItemById } from "@/features/inventory/server";

export default async function InventoryDetailPage({ params }: { params: { id: string } }) {
  const item = await getInventoryItemById(params.id);
  if (!item) notFound();
  const activities = item.movements.map((m: InventoryMovement) => `${(m.committedAt ?? m.scheduledAt ?? m.createdAt).toISOString().slice(0,10)} ${inventoryMovementTypeLabel(m.movementType)}(${inventoryMovementStatusLabel(m.status)}) ${m.quantityDelta > 0 ? "+" : ""}${m.quantityDelta}台`);
  const margin = (item.plannedSaleUnitPrice ?? 0) - (item.purchaseUnitPrice ?? 0);
  const marginRate = item.plannedSaleUnitPrice ? Math.round((margin / item.plannedSaleUnitPrice) * 1000) / 10 : 0;

  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><Link href="/inventory/items" className="text-sm text-blue-600 underline">← 在庫一覧へ戻る</Link>
    <h1 className="mt-3 text-2xl font-bold">在庫詳細 {item.id}</h1>
    <InventorySectionCard title="概要" className="mt-5" description="販売管理・倉庫管理に必要な情報を同時に確認できます。">
      <div className="grid gap-3 text-sm md:grid-cols-3">{[["機種名", item.machineModel?.name ?? item.modelNameSnapshot], ["メーカー", item.maker?.name ?? item.makerNameSnapshot ?? "-"], ["台数", formatQuantity(item.quantityOnHand)], ["保管場所", item.storageLocation?.name ?? "-"]].map(([k, v]) => <div key={k}><p className="text-slate-500">{k}</p><p className="font-medium">{v}</p></div>)}<div><p className="text-slate-500">ステータス</p><InventoryStatusBadge status={inventoryStatusLabel(item.inventoryStatus)} /></div><div><p className="text-slate-500">出品状態</p><InventoryStatusBadge status={inventoryListingStatusLabel(item.listingStatus)} /></div></div>
    </InventorySectionCard>
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><InventorySectionCard title="この在庫でできること"><ul className="space-y-2 text-sm"><li className="flex items-center justify-between"><span>パチマートに出品する（STEP2以降）</span><InventoryPlannedBadge label="連携予定" /></li></ul></InventorySectionCard><InventorySectionCard title="利益見込み"><div className="grid gap-3 text-sm sm:grid-cols-2">{[["仕入価格", formatCurrency(item.purchaseUnitPrice)], ["販売予定価格", formatCurrency(item.plannedSaleUnitPrice)], ["粗利見込み", formatCurrency(margin)], ["粗利率", `${marginRate}%`]].map(([k, v]) => <div key={k}><p className="text-slate-500">{k}</p><p className="font-semibold">{v}</p></div>)}</div></InventorySectionCard></div>
    <InventorySectionCard title="関連する動き" className="mt-5"><InventoryTimeline items={activities.length ? activities : ["履歴はありません"]} /></InventorySectionCard>
    <div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled>パチマートに出品する</Button></div>
  </div>;
}
