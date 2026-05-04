"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatQuantity, inventoryItems } from "@/features/inventory/mock";

export default function InventoryItemsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全て");
  const rows = useMemo(() => inventoryItems.filter((i) => (status === "全て" || i.status === status) && (`${i.manufacturer}${i.modelName}`).toLowerCase().includes(query.toLowerCase())), [query, status]);
  return <div className="mx-auto max-w-6xl px-4 py-8 md:px-6"><InventoryTabs /><h1 className="text-2xl font-bold">在庫物件一覧</h1>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><Input placeholder="メーカー・機種名で検索" value={query} onChange={(e)=>setQuery(e.target.value)} className="bg-white" /><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full bg-white sm:w-48"><SelectValue /></SelectTrigger><SelectContent>{["全て","在庫","商談中","発送予定","売却済"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
    <div className="mt-4 overflow-x-auto rounded-lg border bg-white"><table className="min-w-[1200px] w-full text-sm"><thead className="bg-slate-50 text-left"><tr>{["在庫ID","種別","メーカー","機種名","枠色","台数","保管場所","仕入価格","販売予定価格","ステータス","出品状態","詳細"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{rows.map((i)=><tr key={i.id} className="border-t"><td className="px-3 py-2 font-medium">{i.id}</td><td className="px-3 py-2">{i.type}</td><td className="px-3 py-2">{i.manufacturer}</td><td className="px-3 py-2">{i.modelName}</td><td className="px-3 py-2">{i.frameColor}</td><td className="px-3 py-2">{formatQuantity(i.quantity)}</td><td className="px-3 py-2">{i.storageLocation}</td><td className="px-3 py-2">{formatCurrency(i.purchasePrice)}</td><td className="px-3 py-2">{formatCurrency(i.plannedSalePrice)}</td><td className="px-3 py-2"><InventoryStatusBadge status={i.status} /></td><td className="px-3 py-2"><InventoryStatusBadge status={i.listingStatus} /></td><td className="px-3 py-2"><Link href={`/inventory/items/${i.id}`} className="text-blue-600 underline">詳細</Link></td></tr>)}</tbody></table></div>
  </div>;
}
