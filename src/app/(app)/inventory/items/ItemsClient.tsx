"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatQuantity } from "@/features/inventory/labels";
import { calculateProjectedProfit } from "@/features/inventory/profit";
import { InventoryProfitMini } from "@/features/inventory/components/InventoryProfit";

type Row = { id:string; type:string; manufacturer:string; modelName:string; frameColor:string; quantity:number; storageLocation:string; purchasePrice:number | null; plannedSalePrice:number | null; status:string; listingStatus:string };

export default function ItemsClient({ rows: allRows, total }: { rows: Row[]; total:number }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全て");
  const rows = useMemo(() => allRows.filter((item) => (status === "全て" || item.status === status) && `${item.manufacturer}${item.modelName}`.toLowerCase().includes(query.toLowerCase())), [allRows, query, status]);
  const summary = [["在庫", `${allRows.filter((i) => i.status === "在庫").reduce((a, i) => a + i.quantity, 0)}台`],["商談中", `${allRows.filter((i) => i.status === "商談中").reduce((a, i) => a + i.quantity, 0)}台`],["出庫予定", `${allRows.filter((i) => i.status === "出庫予定").reduce((a, i) => a + i.quantity, 0)}台`],["出品中", `${allRows.filter((i) => i.listingStatus === "出品中").reduce((a, i) => a + i.quantity, 0)}台`],] as const;

  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">在庫物件一覧</h1><Link href="/inventory/items/new" className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">在庫を登録する</Link></div><p className="mt-2 text-sm text-slate-600">在庫Unit・入庫・出庫・販売連携・保管状況をまとめて確認します（全{total}台）。</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summary.map(([l, v]) => <InventorySummaryCard key={l} label={l} value={v} />)}</div>
    <Card className="mt-4"><CardHeader><CardTitle className="text-base">検索・フィルター</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-3 sm:flex-row"><Input placeholder="メーカー・機種名で検索" value={query} onChange={(e) => setQuery(e.target.value)} className="bg-white" /><Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">{"全て,在庫,商談中,出庫予定,売却済".split(",").map((option) => <option key={option} value={option}>{option}</option>)}</Select></div></CardContent></Card>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="w-full min-w-[1240px] text-sm"><thead className="bg-slate-50 text-left"><tr>{["在庫ID", "種別", "メーカー", "機種名", "枠色", "台数", "保管場所", "仕入価格", "販売予定価格", "見込み粗利", "ステータス", "出品状態", "詳細"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody>{rows.map((item) => {
      const projectedProfit = calculateProjectedProfit({
        purchaseUnitPrice: item.purchasePrice,
        plannedSaleUnitPrice: item.plannedSalePrice,
        quantity: item.quantity,
      });
      return <tr key={item.id} className="border-t align-middle"><td className="px-4 py-3 font-semibold">{item.id}</td><td className="px-4 py-3">{item.type}</td><td className="px-4 py-3">{item.manufacturer}</td><td className="px-4 py-3">{item.modelName}</td><td className="px-4 py-3">{item.frameColor}</td><td className="px-4 py-3 font-medium">{formatQuantity(item.quantity)}</td><td className="px-4 py-3">{item.storageLocation}</td><td className="px-4 py-3 font-medium">{item.purchasePrice != null ? formatCurrency(item.purchasePrice) : "原価未入力"}</td><td className="px-4 py-3 font-medium">{item.plannedSalePrice != null ? formatCurrency(item.plannedSalePrice) : "販売予定価格未入力"}</td><td className="px-4 py-3 font-semibold"><InventoryProfitMini projected={projectedProfit} /></td><td className="px-4 py-3"><InventoryStatusBadge status={item.status} /></td><td className="px-4 py-3"><InventoryStatusBadge status={item.listingStatus} /></td><td className="px-4 py-3"><Link href={`/inventory/items/${item.id}`} className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">詳細を見る</Link></td></tr>;
    })}</tbody></table></div>
  </div>;
}
