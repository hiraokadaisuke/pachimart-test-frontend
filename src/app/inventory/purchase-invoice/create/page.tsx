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
    <div className="space-y-6 mx-[1cm]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-600 px-3 py-2 text-white">
        <div>
          <h1 className="text-2xl font-bold text-white">購入伝票作成</h1>
          <p className="text-sm text-white/80 font-normal">未作成の在庫を選択して業者/ホール伝票登録へ進みます。</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCreateDraft("vendor")}
            className="rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
          >
            業者伝票登録
          </button>
          <button
            onClick={() => handleCreateDraft("hall")}
            className="rounded-none border border-gray-300 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[inset_1px_1px_0px_0px_#ffffff] hover:bg-slate-100"
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
            className="w-72 border border-gray-300 bg-white px-2 py-1 text-sm focus:border-slate-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-300 bg-white">
        <table className="min-w-full table-fixed border-collapse text-sm">
          <thead className="bg-slate-600 text-left text-xs font-bold text-white">
            <tr>
              <th className="w-[80px] border border-gray-300 px-3 py-3">選択</th>
              <th className="w-[136px] border border-gray-300 px-3 py-3">在庫管理ID</th>
              <th className="w-[130px] border border-gray-300 px-3 py-3">在庫入力日</th>
              <th className="w-[136px] border border-gray-300 px-3 py-3">メーカー名</th>
              <th className="w-[196px] border border-gray-300 px-3 py-3">機種名</th>
              <th className="w-[96px] border border-gray-300 px-3 py-3">タイプ</th>
              <th className="w-[90px] border border-gray-300 px-3 py-3 text-right">仕入数</th>
              <th className="w-[132px] border border-gray-300 px-3 py-3 text-right">仕入単価</th>
              <th className="w-[120px] border border-gray-300 px-3 py-3">入庫日</th>
              <th className="w-[156px] border border-gray-300 px-3 py-3">仕入先</th>
              <th className="w-[132px] border border-gray-300 px-3 py-3">仕入担当</th>
              <th className="w-[124px] border border-gray-300 px-3 py-3">番号入力</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="border border-gray-300 px-3 py-6 text-center text-sm text-neutral-600">
                  未作成の在庫がありません。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="border border-gray-300 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected[item.id] ?? false}
                      onChange={() => toggleSelect(item.id)}
                      className="h-4 w-4 rounded-none border-gray-300 text-slate-600 focus:ring-slate-600"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-3 font-mono text-sm text-neutral-900 whitespace-nowrap text-ellipsis">
                    {item.id}
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatDate(item.createdAt)}>
                      {formatDate(item.createdAt)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.maker}>
                      {item.maker}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.machineName}>
                      {item.machineName}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.type}>
                      {item.type}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={String(item.quantity)}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-right text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatCurrency(item.unitPrice)}>
                      {formatCurrency(item.unitPrice)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatDate(item.arrivalDate)}>
                      {formatDate(item.arrivalDate)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.supplier}>
                      {item.supplier}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-neutral-800">
                    <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.buyerStaff}>
                      {item.buyerStaff}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleSerialInput(item.id)}
                      className={`flex h-9 w-full items-center justify-center rounded-none border px-3 text-xs font-semibold transition ${
                        completed[item.id]
                          ? "border-gray-300 bg-slate-100 text-slate-800 hover:bg-slate-50"
                          : "border-gray-300 bg-white text-slate-800 hover:bg-slate-50"
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
