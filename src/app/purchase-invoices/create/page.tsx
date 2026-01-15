"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { loadSimpleInventory, updateInventoryStatus } from "@/lib/demo-data/inventory";
import PageTitleBand from "@/components/common/PageTitleBand";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
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

export default function PurchaseInvoiceCreatePage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<SimpleInventory[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setInventories(loadSimpleInventory());
    const invoices = loadPurchaseInvoices();
    setUsedIds(new Set(invoices.flatMap((invoice) => invoice.inventoryIds)));
  }, []);

  const candidates = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return inventories
      .filter((item) => !usedIds.has(item.id))
      .filter((item) => {
        if (!keyword) return true;
        const target = `${item.maker ?? ""} ${item.machineName ?? ""} ${item.supplier ?? ""}`;
        return target.toLowerCase().includes(keyword);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inventories, searchTerm, usedIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? candidates.map((item) => item.id) : []);
  };

  const handleStatusChange = (id: string, status: InventoryStatusOption) => {
    setInventories((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    updateInventoryStatus(id, status);
  };

  const goRegister = (type: "vendor" | "hall") => {
    if (selectedIds.length === 0) {
      alert("在庫を選択してください");
      return;
    }
    router.push(`/purchase-invoices/register/${type}?ids=${selectedIds.join(",")}`);
  };

  return (
    <div className="space-y-6">
      <PageTitleBand title="購入伝票作成" description="未作成の在庫から、登録したい伝票を選択してください。" />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-4 text-sm text-neutral-800">
          <div>選択中：{selectedIds.length}件</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goRegister("vendor")}
              disabled={selectedIds.length === 0}
              className="rounded-md bg-sky-600 px-3 py-2 font-semibold text-white shadow disabled:opacity-50"
            >
              業者伝票登録
            </button>
            <button
              type="button"
              onClick={() => goRegister("hall")}
              disabled={selectedIds.length === 0}
              className="rounded-md bg-emerald-600 px-3 py-2 font-semibold text-white shadow disabled:opacity-50"
            >
              ホール伝票登録
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="create-search" className="text-sm text-neutral-700">
            検索
          </label>
          <input
            id="create-search"
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
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === candidates.length}
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </th>
              <th className="px-3 py-3">在庫ID</th>
              <th className="px-3 py-3">在庫入力日</th>
              <th className="px-3 py-3">メーカー名</th>
              <th className="px-3 py-3">機種名</th>
              <th className="px-3 py-3">タイプ</th>
              <th className="px-3 py-3 text-right">数量</th>
              <th className="px-3 py-3 text-right">単価</th>
              <th className="px-3 py-3">仕入先</th>
              <th className="px-3 py-3">状況</th>
              <th className="px-3 py-3">番号入力</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-sm text-neutral-600">
                  未作成の対象はありません
                </td>
              </tr>
            ) : (
              candidates.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleSelection(item.id)} />
                    </td>
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
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                        onClick={() => alert("番号入力は未実装です")}
                      >
                        番号入力
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
