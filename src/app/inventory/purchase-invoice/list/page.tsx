"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import {
  formatCurrency,
  formatDate,
  loadInventoryRecords,
  saveDraft,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import type { PurchaseInvoice } from "@/types/purchaseInvoices";

export default function PurchaseInvoiceListPage() {
  const router = useRouter();
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [modalInvoice, setModalInvoice] = useState<PurchaseInvoice | null>(null);

  useEffect(() => {
    setInventories(loadInventoryRecords());
    setInvoices(loadPurchaseInvoices());
  }, []);

  const uncreated = useMemo(() => inventories.filter((inv) => !inv.purchaseInvoiceId), [inventories]);

  const created = useMemo(() => invoices, [invoices]);

  const handleCreateFromRow = (inventoryId: string, type: "vendor" | "hall") => {
    const draftId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    saveDraft({ id: draftId, inventoryIds: [inventoryId] });
    router.push(`/inventory/purchase-invoice/${type}/${draftId}`);
  };

  const renderDocumentButtons = (invoice: PurchaseInvoice) => (
    <div className="flex flex-wrap gap-2">
      {[
        "売買契約書",
        "支払依頼書",
        "入庫検品依頼書 兼 引取依頼書",
        "書類一括印刷",
      ].map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => alert(`${label} はデモ表示です`)}
          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">未作成一覧</h2>
          <p className="text-sm text-neutral-600">伝票が未作成の在庫です。行から直接伝票登録に進めます。</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-fixed divide-y divide-slate-200 border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="w-[132px] px-3 py-3 font-semibold text-slate-700">在庫ID</th>
                <th className="w-[220px] px-3 py-3 font-semibold text-slate-700">メーカー/機種</th>
                <th className="w-[156px] px-3 py-3 font-semibold text-slate-700">仕入先</th>
                <th className="w-[112px] px-3 py-3 font-semibold text-slate-700">状況</th>
                <th className="w-[240px] px-3 py-3 font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uncreated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-neutral-600">
                    未作成の在庫はありません。
                  </td>
                </tr>
              ) : (
                uncreated.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono text-sm text-neutral-900 whitespace-nowrap text-ellipsis">
                      {inv.id}
                    </td>
                    <td className="px-3 py-3 text-neutral-800">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold" title={inv.machineName}>
                        {inv.machineName}
                      </div>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500" title={inv.maker}>
                        {inv.maker}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-800">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={inv.supplier}>
                        {inv.supplier}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-neutral-800">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={inv.stockStatus}>
                        {inv.stockStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2 whitespace-nowrap text-xs">
                        <button
                          type="button"
                          onClick={() => handleCreateFromRow(inv.id, "vendor")}
                          className="rounded-md bg-amber-600 px-3 py-1 font-semibold text-white shadow hover:bg-amber-500"
                        >
                          業者伝票登録
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateFromRow(inv.id, "hall")}
                          className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white shadow hover:bg-emerald-500"
                        >
                          ホール伝票登録
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">作成済み一覧</h2>
            <p className="text-sm text-neutral-600">作成済みの購入伝票を表示します。詳細や帳票ボタンはデモ挙動です。</p>
          </div>
          <Link
            href="/inventory/purchase-invoice/create"
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            未作成から選ぶ
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full table-fixed divide-y divide-slate-200 border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="w-[132px] px-3 py-3 font-semibold text-slate-700">伝票ID</th>
                <th className="w-[126px] px-3 py-3 font-semibold text-slate-700">作成日</th>
                <th className="w-[220px] px-3 py-3 font-semibold text-slate-700">機種</th>
                <th className="w-[140px] px-3 py-3 text-right font-semibold text-slate-700">合計</th>
                <th className="w-[200px] px-3 py-3 font-semibold text-slate-700">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {created.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-neutral-600">
                    作成済みの伝票はありません。
                  </td>
                </tr>
              ) : (
                created.map((invoice) => (
                  <tr key={invoice.invoiceId} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono text-sm text-neutral-900 whitespace-nowrap text-ellipsis">
                      {invoice.invoiceId}
                    </td>
                    <td className="px-3 py-3 text-neutral-800">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatDate(invoice.createdAt)}>
                        {formatDate(invoice.createdAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-neutral-800">
                      <span
                        className="block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={invoice.displayTitle ?? invoice.items[0]?.machineName}
                      >
                        {invoice.displayTitle ?? `${invoice.items[0]?.machineName ?? "-"}${invoice.items.length > 1 ? " 他" : ""}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-neutral-800">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatCurrency(invoice.totalAmount)}>
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setModalInvoice(invoice)}
                          className="rounded-md border border-slate-200 px-3 py-1 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          詳細
                        </button>
                        {renderDocumentButtons(invoice)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-neutral-900">{modalInvoice.invoiceId}</div>
                <div className="text-sm text-neutral-600">{modalInvoice.partnerName ?? modalInvoice.invoiceType.toUpperCase()}</div>
              </div>
              <button
                type="button"
                onClick={() => setModalInvoice(null)}
                className="rounded-md border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-slate-200 border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
                  <tr>
                    <th className="w-[152px] px-3 py-3 font-semibold text-slate-700">メーカー</th>
                    <th className="w-[220px] px-3 py-3 font-semibold text-slate-700">機種</th>
                    <th className="w-[96px] px-3 py-3 text-right font-semibold text-slate-700">数量</th>
                    <th className="w-[128px] px-3 py-3 text-right font-semibold text-slate-700">単価</th>
                    <th className="w-[140px] px-3 py-3 text-right font-semibold text-slate-700">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modalInvoice.items.map((item) => (
                    <tr key={`${modalInvoice.invoiceId}-${item.inventoryId}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-neutral-800">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.maker}>
                          {item.maker}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-neutral-800">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={item.machineName}>
                          {item.machineName}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-800">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={String(item.quantity)}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-800">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatCurrency(item.unitPrice)}>
                          {formatCurrency(item.unitPrice)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-neutral-800">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap" title={formatCurrency(item.amount)}>
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
