"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { loadSimpleInventory, updateInventoryStatus } from "@/lib/demo-data/inventory";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import type {
  InventoryStatusOption,
  PurchaseInvoice,
  SimpleInventory,
} from "@/types/purchaseInvoices";

const STATUS_OPTIONS: InventoryStatusOption[] = ["倉庫", "出品中", "売却済"];

type TabKey = "all" | "vendor" | "hall";

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

const summarizeMachine = (invoice: PurchaseInvoice) => {
  const first = invoice.items[0];
  if (!first) return "-";
  if (invoice.items.length === 1) return first.machineName ?? "-";
  return `${first.machineName ?? "-"} 他`;
};

export default function PurchaseInvoicesPage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<SimpleInventory[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tab, setTab] = useState<TabKey>("all");

  useEffect(() => {
    setInventories(loadSimpleInventory());
    setInvoices(loadPurchaseInvoices());
  }, []);

  const usedInventoryIds = useMemo(() => new Set(invoices.flatMap((invoice) => invoice.inventoryIds)), [invoices]);

  const unassigned = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return inventories
      .filter((item) => !usedInventoryIds.has(item.id))
      .filter((item) => {
        if (!keyword) return true;
        const target = `${item.maker ?? ""} ${item.machineName ?? ""} ${item.supplier ?? ""}`;
        return target.toLowerCase().includes(keyword);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inventories, searchTerm, usedInventoryIds]);

  const filteredInvoices = useMemo(() => {
    if (tab === "all") return invoices;
    return invoices.filter((invoice) => invoice.invoiceType === tab);
  }, [invoices, tab]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? unassigned.map((item) => item.id) : []);
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
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">未作成一覧</h1>
          <p className="text-sm text-neutral-600">在庫登録済みで、購入伝票が未作成の在庫を表示します</p>
        </div>

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
            <label htmlFor="uncreated-search" className="text-sm text-neutral-700">
              検索
            </label>
            <input
              id="uncreated-search"
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
                    checked={selectedIds.length > 0 && selectedIds.length === unassigned.length}
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
              {unassigned.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-6 text-center text-sm text-neutral-600">
                    未作成の対象はありません
                  </td>
                </tr>
              ) : (
                unassigned.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelection(item.id)}
                        />
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
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">作成済み一覧</h2>
            <p className="text-sm text-neutral-600">保存済みの業者・ホール伝票を確認できます</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-md px-3 py-2 shadow-sm ${tab === "all" ? "bg-sky-600 text-white" : "bg-slate-100"}`}
            >
              すべて
            </button>
            <button
              type="button"
              onClick={() => setTab("vendor")}
              className={`rounded-md px-3 py-2 shadow-sm ${
                tab === "vendor" ? "bg-sky-600 text-white" : "bg-slate-100"
              }`}
            >
              業者
            </button>
            <button
              type="button"
              onClick={() => setTab("hall")}
              className={`rounded-md px-3 py-2 shadow-sm ${
                tab === "hall" ? "bg-sky-600 text-white" : "bg-slate-100"
              }`}
            >
              ホール
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-3">伝票ID</th>
                <th className="px-3 py-3">区分</th>
                <th className="px-3 py-3">伝票発行日</th>
                <th className="px-3 py-3">相手先名</th>
                <th className="px-3 py-3">機種名</th>
                <th className="px-3 py-3 text-right">件数</th>
                <th className="px-3 py-3 text-right">合計金額</th>
                <th className="px-3 py-3">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-neutral-600">
                    作成済み伝票がありません
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.invoiceId} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono text-sm text-neutral-900">{invoice.invoiceId}</td>
                    <td className="px-3 py-3 text-neutral-800">{invoice.invoiceType === "vendor" ? "業者" : "ホール"}</td>
                    <td className="px-3 py-3 text-neutral-800">{formatDate(invoice.issuedDate)}</td>
                    <td className="px-3 py-3 text-neutral-800">{invoice.partnerName ?? "-"}</td>
                    <td className="px-3 py-3 text-neutral-800">{summarizeMachine(invoice)}</td>
                    <td className="px-3 py-3 text-right text-neutral-800">{invoice.items.length}</td>
                    <td className="px-3 py-3 text-right text-neutral-800">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                        onClick={() => alert("詳細表示は未実装です")}
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
