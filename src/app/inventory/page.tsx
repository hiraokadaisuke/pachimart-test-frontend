"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { loadSimpleInventory, updateInventoryStatus } from "@/lib/demo-data/inventory";
import type { InventoryStatusOption, SimpleInventory } from "@/types/purchaseInvoices";

const STATUS_OPTIONS: InventoryStatusOption[] = ["倉庫", "出品中", "売却済"];

const formatCurrency = (value?: number) => {
  if (value == null) return "-";
  return value.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ja-JP");
};

export default function InventoryPage() {
  const [inventories, setInventories] = useState<SimpleInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setInventories(loadSimpleInventory());
  }, []);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim();
    const sorted = [...inventories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (!keyword) return sorted;

    return sorted.filter((item) => {
      const target = `${item.maker ?? ""} ${item.machineName ?? ""} ${item.supplier ?? ""}`;
      return target.toLowerCase().includes(keyword.toLowerCase());
    });
  }, [inventories, searchTerm]);

  const handleStatusChange = (id: string, status: InventoryStatusOption) => {
    setInventories((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    updateInventoryStatus(id, status);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">在庫一覧</h1>
          <p className="text-sm text-neutral-600">登録された在庫を確認・ステータス更新できます。</p>
        </div>
        <Link
          href="/inventory/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
        >
          在庫を登録
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            CSV出力
          </button>
          <Link
            href="/inventory/new"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            個別登録
          </Link>
          <button className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            表示項目設定
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="inventory-search" className="text-sm text-neutral-700">
            検索 / 絞り込み
          </label>
          <input
            id="inventory-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="メーカー名 / 機種名 / 仕入先"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-3 py-3">在庫ID</th>
              <th className="px-3 py-3">在庫入力日</th>
              <th className="px-3 py-3">メーカー名</th>
              <th className="px-3 py-3">機種名</th>
              <th className="px-3 py-3">タイプ</th>
              <th className="px-3 py-3 text-right">数量</th>
              <th className="px-3 py-3 text-right">単価</th>
              <th className="px-3 py-3">仕入先</th>
              <th className="px-3 py-3">状況</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-neutral-600">
                  登録された在庫がありません。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-mono text-sm text-neutral-900">{item.id}</td>
                  <td className="px-3 py-3 text-neutral-800">{formatDate(item.createdAt)}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.maker ?? "-"}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.machineName ?? "-"}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.type ?? "-"}</td>
                  <td className="px-3 py-3 text-right text-neutral-800">{item.quantity ?? 1}</td>
                  <td className="px-3 py-3 text-right text-neutral-800">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.supplier ?? "-"}</td>
                  <td className="px-3 py-3">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        handleStatusChange(item.id, event.target.value as InventoryStatusOption)
                      }
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
