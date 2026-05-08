"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { InventoryStatusBadge } from "@/components/inventory-demo/InventoryStatusBadge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InventoryProfitMini } from "@/features/inventory/components/InventoryProfit";
import { formatCurrency, formatQuantity } from "@/features/inventory/labels";
import { calculateProjectedProfit } from "@/features/inventory/profit";

type Row = {
  id: string;
  type: string;
  manufacturer: string;
  modelName: string;
  frameColor: string;
  quantity: number;
  storageLocation: string;
  purchasePrice: number | null;
  plannedSalePrice: number | null;
  status: string;
  listingStatus: string;
};

function shortenInventoryId(id: string) {
  if (id.startsWith("INV-") && id.length <= 12) return id;
  if (id.length <= 16) return id;
  return `${id.slice(0, 6)}…${id.slice(-5)}`;
}

export default function ItemsClient({ rows: allRows, total }: { rows: Row[]; total: number }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全て");

  const rows = useMemo(
    () =>
      allRows.filter(
        (item) =>
          (status === "全て" || item.status === status) &&
          `${item.manufacturer}${item.modelName}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [allRows, query, status],
  );

  const filterLabel = [query ? `キーワード: ${query}` : null, status !== "全て" ? `ステータス: ${status}` : null]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="mx-auto w-full max-w-[1680px] px-3 py-3 md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">在庫一覧</h1>
        <Link href="/inventory/items/new" className="inline-flex rounded border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800">
          在庫登録
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-slate-600">在庫Unit・入庫・出庫・販売連携・保管状況を確認できます。（全{total}台）</p>

      <details className="mt-2 rounded border border-slate-300 bg-white">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-700">
          検索条件を表示（{filterLabel || "全件"}）
        </summary>
        <div className="grid gap-2 border-t border-slate-200 p-3 md:grid-cols-4">
          <Input placeholder="機種名・メーカーで検索" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 bg-white text-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 text-xs">
            {"全て,在庫,商談中,出庫予定,売却済".split(",").map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2 md:justify-self-end">
            <button
              onClick={() => {
                setQuery("");
                setStatus("全て");
              }}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              クリア
            </button>
          </div>
        </div>
      </details>

      <div className="mt-2 overflow-x-auto rounded border border-slate-300 bg-white">
        <div className="flex min-w-[1450px] items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-xs">
          <div className="font-semibold text-slate-700">検索結果: {rows.length}件</div>
          <div className="flex items-center gap-2 text-slate-600">
            <span>表示件数: {rows.length}</span>
            <button type="button" onClick={() => window.location.reload()} className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
              再読み込み
            </button>
          </div>
        </div>
        <table className="w-full min-w-[1450px] text-xs">
          <thead className="bg-slate-100 text-left text-slate-700">
            <tr>
              {["No.", "在庫ID", "機種名", "メーカー", "区分", "枠色", "台数", "保管場所", "仕入価格", "販売予定価格", "見込み粗利", "ステータス", "出品状態", "出庫状態", "詳細"].map((header) => (
                <th key={header} className="whitespace-nowrap px-2 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => {
              const projectedProfit = calculateProjectedProfit({ purchaseUnitPrice: item.purchasePrice, plannedSaleUnitPrice: item.plannedSalePrice, quantity: item.quantity });
              return (
                <tr key={item.id} className="border-t border-slate-200 align-middle">
                  <td className="px-2 py-1.5 text-slate-500">{idx + 1}</td>
                  <td className="px-2 py-1.5 font-semibold" title={item.id}>{shortenInventoryId(item.id)}</td>
                  <td className="px-2 py-1.5 font-semibold">{item.modelName || "-"}</td>
                  <td className="px-2 py-1.5">{item.manufacturer || "-"}</td>
                  <td className="px-2 py-1.5">{item.type || "-"}</td>
                  <td className="px-2 py-1.5">{item.frameColor || "-"}</td>
                  <td className="px-2 py-1.5 font-medium">{formatQuantity(item.quantity)}</td>
                  <td className="px-2 py-1.5">{item.storageLocation || "-"}</td>
                  <td className="px-2 py-1.5">{item.purchasePrice != null ? formatCurrency(item.purchasePrice) : "-"}</td>
                  <td className="px-2 py-1.5">{item.plannedSalePrice != null ? formatCurrency(item.plannedSalePrice) : "-"}</td>
                  <td className="px-2 py-1.5 font-semibold"><InventoryProfitMini projected={projectedProfit} /></td>
                  <td className="px-2 py-1.5"><InventoryStatusBadge status={item.status} /></td>
                  <td className="px-2 py-1.5"><InventoryStatusBadge status={item.listingStatus} /></td>
                  <td className="px-2 py-1.5"><InventoryStatusBadge status={item.status === "出庫予定" ? "出庫予定" : "-"} /></td>
                  <td className="px-2 py-1.5"><Link href={`/inventory/items/${item.id}`} className="inline-flex rounded-sm border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50">詳細</Link></td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-3 py-8 text-center text-slate-500">条件に一致する在庫はありません。</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
