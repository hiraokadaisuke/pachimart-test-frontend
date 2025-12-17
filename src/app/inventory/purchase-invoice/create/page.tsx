"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatCurrency,
  formatDate,
  loadInventoryRecords,
  saveDraft,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";

export default function PurchaseInvoiceCreatePage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [numbers, setNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    setInventories(loadInventoryRecords());
  }, []);

  const unassigned = useMemo(
    () => inventories.filter((item) => !item.purchaseInvoiceId),
    [inventories],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return unassigned;
    return unassigned.filter((item) => {
      const target = `${item.id} ${item.maker} ${item.machineName} ${item.supplier} ${item.buyerStaff}`;
      return target.toLowerCase().includes(keyword);
    });
  }, [search, unassigned]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([id]) => id), [selected]);

  const handleCreateDraft = (type: "vendor" | "hall") => {
    if (selectedIds.length === 0) {
      alert("伝票対象の在庫を選択してください");
      return;
    }
    const draftId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    saveDraft({ id: draftId, inventoryIds: selectedIds });
    router.push(`/inventory/purchase-invoice/${type === "vendor" ? "vendor" : "hall"}/${draftId}`);
  };

  const handleNumberClick = (id: string) => {
    alert(`${id} の番号入力: ${numbers[id] ?? "未入力"}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">購入伝票作成</h1>
          <p className="text-sm text-neutral-600">未作成の在庫を選択して業者/ホール伝票登録へ進みます。</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="invoice-search" className="text-sm text-neutral-700">
            検索 / 絞り込み
          </label>
          <input
            id="invoice-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ID / メーカー / 機種 / 仕入先 / 担当"
            className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCreateDraft("vendor")}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-500"
          >
            業者伝票登録
          </button>
          <button
            onClick={() => handleCreateDraft("hall")}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
          >
            ホール伝票登録
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-3 py-3">選択</th>
              <th className="px-3 py-3">在庫管理ID</th>
              <th className="px-3 py-3">在庫入力日</th>
              <th className="px-3 py-3">メーカー名</th>
              <th className="px-3 py-3">機種名</th>
              <th className="px-3 py-3">タイプ</th>
              <th className="px-3 py-3 text-right">仕入数</th>
              <th className="px-3 py-3 text-right">仕入単価</th>
              <th className="px-3 py-3">入庫日</th>
              <th className="px-3 py-3">仕入先</th>
              <th className="px-3 py-3">仕入担当</th>
              <th className="px-3 py-3">番号入力</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-sm text-neutral-600">
                  未作成の在庫がありません。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected[item.id] ?? false}
                      onChange={() => toggleSelect(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-neutral-900">{item.id}</td>
                  <td className="px-3 py-3 text-neutral-800">{formatDate(item.createdAt)}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.maker}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.machineName}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.type}</td>
                  <td className="px-3 py-3 text-right text-neutral-800">{item.quantity}</td>
                  <td className="px-3 py-3 text-right text-neutral-800">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-3 py-3 text-neutral-800">{formatDate(item.arrivalDate)}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.supplier}</td>
                  <td className="px-3 py-3 text-neutral-800">{item.buyerStaff}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={numbers[item.id] ?? ""}
                        onChange={(event) => setNumbers((prev) => ({ ...prev, [item.id]: event.target.value }))}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleNumberClick(item.id)}
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
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
