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

  return <div className="mx-auto w-full max-w-[1680px] px-3 py-4 md:px-5"><InventoryTabs /><div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-bold text-slate-900">在庫一覧</h1><Link href="/inventory/items/new" className="inline-flex rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800">在庫登録</Link></div><p className="mt-1 text-xs text-slate-600">在庫Unit・入庫・出庫・販売連携・保管状況を確認できます。（全{total}台）</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{summary.map(([l, v]) => <InventorySummaryCard key={l} label={l} value={v} />)}</div>
    <details className="mt-3 rounded-md border border-slate-300 bg-white" open><summary className="cursor-pointer list-none border-b border-slate-200 px-3 py-2 text-xs font-semibold">検索条件</summary><div className="grid gap-2 p-3 md:grid-cols-4"><Input placeholder="機種名・メーカーで検索" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 bg-white text-xs" /><Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 text-xs">{"全て,在庫,商談中,出庫予定,売却済".split(",").map((option) => <option key={option} value={option}>{option}</option>)}</Select><div className="md:col-span-2 md:justify-self-end"><button onClick={() => { setQuery(""); setStatus("全て"); }} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">クリア</button></div></div></details>
    <div className="mt-3 overflow-x-auto rounded-md border border-slate-300 bg-white"><table className="w-full min-w-[1450px] text-xs"><thead className="bg-slate-100 text-left text-slate-700"><tr>{["No.", "在庫ID", "機種名", "メーカー", "区分", "枠色", "台数", "保管場所", "仕入価格", "販売予定価格", "見込み粗利", "ステータス", "出品状態", "出庫状態", "詳細"].map((header) => <th key={header} className="whitespace-nowrap px-2 py-2 font-semibold">{header}</th>)}</tr></thead><tbody>{rows.map((item, idx) => {
      const projectedProfit = calculateProjectedProfit({ purchaseUnitPrice: item.purchasePrice, plannedSaleUnitPrice: item.plannedSalePrice, quantity: item.quantity });
      return <tr key={item.id} className="border-t border-slate-200 align-middle"><td className="px-2 py-1.5 text-slate-500">{idx + 1}</td><td className="px-2 py-1.5 font-semibold">{item.id}</td><td className="px-2 py-1.5 font-semibold">{item.modelName || "-"}</td><td className="px-2 py-1.5">{item.manufacturer || "-"}</td><td className="px-2 py-1.5">{item.type || "-"}</td><td className="px-2 py-1.5">{item.frameColor || "-"}</td><td className="px-2 py-1.5 font-medium">{formatQuantity(item.quantity)}</td><td className="px-2 py-1.5">{item.storageLocation || "-"}</td><td className="px-2 py-1.5">{item.purchasePrice != null ? formatCurrency(item.purchasePrice) : "-"}</td><td className="px-2 py-1.5">{item.plannedSalePrice != null ? formatCurrency(item.plannedSalePrice) : "-"}</td><td className="px-2 py-1.5 font-semibold"><InventoryProfitMini projected={projectedProfit} /></td><td className="px-2 py-1.5"><InventoryStatusBadge status={item.status} /></td><td className="px-2 py-1.5"><InventoryStatusBadge status={item.listingStatus} /></td><td className="px-2 py-1.5"><InventoryStatusBadge status={item.status === "出庫予定" ? "出庫予定" : "-"} /></td><td className="px-2 py-1.5"><Link href={`/inventory/items/${item.id}`} className="inline-flex rounded-sm border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50">詳細</Link></td></tr>;
    })}{rows.length === 0 ? <tr><td colSpan={15} className="px-3 py-8 text-center text-slate-500">条件に一致する在庫はありません。</td></tr> : null}</tbody></table></div>
  </div>;
}
