"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { InventorySummaryCard } from "@/components/inventory-demo/InventoryDemoPrimitives";
import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
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

  return <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6"><InventoryTabs /><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-slate-900">在庫物件一覧</h1><Link href="/inventory/items/new" className="inline-flex rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">在庫を登録する</Link></div><p className="mt-2 text-sm text-slate-600">在庫Unit・入庫・出庫・販売連携・保管状況をまとめて確認します（全{total}台）。</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summary.map(([l, v]) => <InventorySummaryCard key={l} label={l} value={v} />)}</div>
    <details className="mt-4 rounded-md border border-slate-300 bg-white" open><summary className="cursor-pointer list-none border-b border-slate-200 px-4 py-3 text-sm font-semibold">検索条件</summary><div className="p-4"><div className="flex flex-col gap-3 sm:flex-row"><Input placeholder="メーカー・機種名で検索" value={query} onChange={(e) => setQuery(e.target.value)} className="bg-white" /><Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">{"全て,在庫,商談中,出庫予定,売却済".split(",").map((option) => <option key={option} value={option}>{option}</option>)}</Select></div></div></details>
    <div className="mt-4 overflow-x-auto rounded-md border border-slate-300 bg-white"><table className="w-full min-w-[1240px] text-xs md:text-sm"><thead className="bg-slate-100 text-left text-slate-700"><tr>{["在庫ID", "種別", "メーカー", "機種名", "枠色", "台数", "保管場所", "仕入価格", "販売予定価格", "見込み粗利", "ステータス", "出品状態", "詳細"].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr></thead><tbody>{rows.map((item) => {
      const projectedProfit = calculateProjectedProfit({
        purchaseUnitPrice: item.purchasePrice,
        plannedSaleUnitPrice: item.plannedSalePrice,
        quantity: item.quantity,
      });
      return <tr key={item.id} className="border-t border-slate-200 align-middle"><td className="px-3 py-2 font-semibold">{item.id}</td><td className="px-3 py-2">{item.type}</td><td className="px-3 py-2">{item.manufacturer}</td><td className="px-3 py-2">{item.modelName}</td><td className="px-3 py-2">{item.frameColor}</td><td className="px-4 py-3 font-medium">{formatQuantity(item.quantity)}</td><td className="px-3 py-2">{item.storageLocation}</td><td className="px-4 py-3 font-medium">{item.purchasePrice != null ? formatCurrency(item.purchasePrice) : "原価未入力"}</td><td className="px-4 py-3 font-medium">{item.plannedSalePrice != null ? formatCurrency(item.plannedSalePrice) : "販売予定価格未入力"}</td><td className="px-3 py-2 font-semibold"><InventoryProfitMini projected={projectedProfit} /></td><td className="px-3 py-2"><InventoryStatusBadge status={item.status} /></td><td className="px-3 py-2"><InventoryStatusBadge status={item.listingStatus} /></td><td className="px-3 py-2"><Link href={`/inventory/items/${item.id}`} className="inline-flex rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">詳細を見る</Link></td></tr>;
    })}</tbody></table></div>
  </div>;
}
