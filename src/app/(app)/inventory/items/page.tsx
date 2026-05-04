"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { InventoryTabs } from "@/components/inventory-demo/InventoryTabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatQuantity, inventoryItems } from "@/features/inventory/mock";

export default function InventoryItemsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全て");

  const rows = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          (status === "全て" || item.status === status) &&
          `${item.manufacturer}${item.modelName}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, status],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <InventoryTabs />
      <h1 className="text-2xl font-bold">在庫物件一覧</h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="メーカー・機種名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
          {["全て", "在庫", "商談中", "発送予定", "売却済"].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              {["在庫ID", "種別", "メーカー", "機種名", "枠色", "台数", "保管場所", "仕入価格", "販売予定価格", "ステータス", "出品状態", "詳細"].map((header) => (
                <th key={header} className="px-3 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2 font-medium">{item.id}</td>
                <td className="px-3 py-2">{item.type}</td>
                <td className="px-3 py-2">{item.manufacturer}</td>
                <td className="px-3 py-2">{item.modelName}</td>
                <td className="px-3 py-2">{item.frameColor}</td>
                <td className="px-3 py-2">{formatQuantity(item.quantity)}</td>
                <td className="px-3 py-2">{item.storageLocation}</td>
                <td className="px-3 py-2">{formatCurrency(item.purchasePrice)}</td>
                <td className="px-3 py-2">{formatCurrency(item.plannedSalePrice)}</td>
                <td className="px-3 py-2"><InventoryStatusBadge status={item.status} /></td>
                <td className="px-3 py-2"><InventoryStatusBadge status={item.listingStatus} /></td>
                <td className="px-3 py-2">
                  <Link href={`/inventory/items/${item.id}`} className="text-blue-600 underline">
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
