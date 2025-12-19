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
import { hasSerialInput, saveSerialOrder } from "@/lib/serialInputStorage";

export default function PurchaseInvoiceCreatePage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const statusMap: Record<string, boolean> = {};
    unassigned.forEach((item) => {
      statusMap[item.id] = hasSerialInput(item.id);
    });
    setCompleted(statusMap);
  }, [unassigned]);

  const handleSerialInput = (id: string) => {
    if (typeof window !== "undefined") {
      saveSerialOrder(filtered.map((item) => item.id));
    }
    router.push(`/inventory/purchase-invoice/serial-input/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">購入伝票作成</h1>
          <p className="text-sm text-neutral-600">未作成の在庫を選択して業者/ホール伝票登録へ進みます。</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex flex-wrap items-center gap-2 md:ml-auto">
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
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed divide-y divide-slate-200 border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="w-[80px] px-3 py-3 font-semibold text-slate-700">選択</th>
              <th className="w-[136px] px-3 py-3 font-semibold text-slate-700">在庫管理ID</th>
              <th className="w-[130px] px-3 py-3 font-semibold text-slate-700">在庫入力日</th>
              <th className="w-[136px] px-3 py-3 font-semibold text-slate-700">メーカー名</th>
              <th className="w-[196px] px-3 py-3 font-semibold text-slate-700">機種名</th>
              <th className="w-[96px] px-3 py-3 font-semibold text-slate-700">タイプ</th>
              <th className="w-[90px] px-3 py-3 text-right font-semibold text-slate-700">仕入数</th>
              <th className="w-[132px] px-3 py-3 text-right font-semibold text-slate-700">仕入単価</th>
              <th className="w-[120px] px-3 py-3 font-semibold text-slate-700">入庫日</th>
              <th className="w-[156px] px-3 py-3 font-semibold text-slate-700">仕入先</th>
              <th className="w-[132px] px-3 py-3 font-semibold text-slate-700">仕入担当</th>
              <th className="w-[124px] px-3 py-3 font-semibold text-slate-700">番号入力</th>
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
                  <td className="px-3 py-3 font-mono text-sm text-neutral-900 whitespace-nowrap text-ellipsis">
                    {item.id}
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatDate(item.createdAt)}>
                      {formatDate(item.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.maker}>
                      {item.maker}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.machineName}>
                      {item.machineName}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.type}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={String(item.quantity)}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatCurrency(item.unitPrice)}>
                      {formatCurrency(item.unitPrice)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatDate(item.arrivalDate)}>
                      {formatDate(item.arrivalDate)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.supplier}>
                      {item.supplier}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.buyerStaff}>
                      {item.buyerStaff}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleSerialInput(item.id)}
                      className={`flex h-9 w-full items-center justify-center rounded-md border px-3 text-xs font-semibold shadow-sm transition ${
                        completed[item.id]
                          ? "border-green-200 bg-green-50 text-emerald-800 hover:bg-green-100"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      +
                    </button>
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
