"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { addPurchaseInvoice, generateInvoiceId } from "@/lib/demo-data/purchaseInvoices";
import {
  deleteDraft,
  formatCurrency,
  loadDraftById,
  loadInventoryRecords,
  markInventoriesWithInvoice,
} from "@/lib/demo-data/demoInventory";
import type { PurchaseInvoiceItem } from "@/types/purchaseInvoices";

export default function HallInvoicePage() {
  const params = useParams<{ draftId: string }>();
  const router = useRouter();
  const [issuedDate, setIssuedDate] = useState<string>("");
  const [partner, setPartner] = useState("");
  const [staff, setStaff] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);

  useEffect(() => {
    const draftId = params?.draftId;
    if (!draftId || Array.isArray(draftId)) return;
    const draft = loadDraftById(draftId);
    const all = loadInventoryRecords();
    const targets = draft ? all.filter((inv) => draft.inventoryIds.includes(inv.id)) : [];
    setIssuedDate(new Date().toISOString().slice(0, 10));
    setItems(
      targets.map((inv) => ({
        inventoryId: inv.id,
        maker: inv.maker,
        machineName: inv.machineName,
        type: inv.type,
        quantity: inv.quantity ?? 0,
        unitPrice: inv.unitPrice ?? 0,
        amount: (inv.quantity ?? 0) * (inv.unitPrice ?? 0),
        note: inv.notes,
      })),
    );
  }, [params?.draftId]);

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.amount ?? 0), 0), [items]);

  const handleItemChange = (index: number, key: keyof PurchaseInvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (key === "quantity" || key === "unitPrice") {
          const quantity = key === "quantity" ? Number(value) : item.quantity;
          const unitPrice = key === "unitPrice" ? Number(value) : item.unitPrice;
          return {
            ...item,
            quantity,
            unitPrice,
            amount: quantity * unitPrice,
          };
        }
        if (key === "amount") {
          return { ...item, amount: Number(value) };
        }
        return { ...item, [key]: value } as PurchaseInvoiceItem;
      }),
    );
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      alert("対象の在庫が見つかりませんでした");
      return;
    }
    const invoiceId = generateInvoiceId("hall");
    addPurchaseInvoice({
      invoiceId,
      invoiceType: "hall",
      createdAt: new Date().toISOString(),
      issuedDate,
      partnerName: partner,
      staff,
      inventoryIds: items.map((item) => item.inventoryId),
      items,
      totalAmount: total,
      formInput: { remarks },
      displayTitle: `${items[0]?.machineName ?? "伝票"}${items.length > 1 ? " 他" : ""}`,
    });
    markInventoriesWithInvoice(
      items.map((item) => item.inventoryId),
      invoiceId,
    );
    if (params?.draftId && !Array.isArray(params.draftId)) {
      deleteDraft(params.draftId);
    }
    router.push("/inventory/purchase-invoice/list");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">購入伝票登録（ホール）</h1>
          <p className="text-sm text-neutral-600">ホール向け帳票として必要な項目を入力してください。</p>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
        >
          確認
        </button>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-neutral-800">
          日付
          <input
            type="date"
            value={issuedDate}
            onChange={(event) => setIssuedDate(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-neutral-800">
          ホール名
          <input
            value={partner}
            onChange={(event) => setPartner(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-neutral-800">
          担当
          <input
            value={staff}
            onChange={(event) => setStaff(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
            <tr>
              <th className="px-3 py-3">メーカー名</th>
              <th className="px-3 py-3">機種名</th>
              <th className="px-3 py-3">タイプ</th>
              <th className="px-3 py-3 text-right">数量</th>
              <th className="px-3 py-3 text-right">単価</th>
              <th className="px-3 py-3 text-right">金額</th>
              <th className="px-3 py-3">申請連絡</th>
              <th className="px-3 py-3">商品補足</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={item.inventoryId} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-neutral-800">{item.maker}</td>
                <td className="px-3 py-3 text-neutral-800">{item.machineName}</td>
                <td className="px-3 py-3 text-neutral-800">{item.type}</td>
                <td className="px-3 py-3 text-right">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(event) => handleItemChange(index, "quantity", Number(event.target.value))}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3 text-right">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(event) => handleItemChange(index, "unitPrice", Number(event.target.value))}
                    className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3 text-right text-neutral-800">{formatCurrency(item.amount)}</td>
                <td className="px-3 py-3">
                  <input
                    value={item.extra?.application ?? ""}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((prevItem, idx) =>
                          idx === index
                            ? { ...prevItem, extra: { ...(prevItem.extra ?? {}), application: event.target.value } }
                            : prevItem,
                        ),
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={item.note ?? ""}
                    onChange={(event) => handleItemChange(index, "note", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-neutral-800">備考</div>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-neutral-800">
          <div className="flex justify-between font-semibold">
            <span>小計</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between">
            <span>消費税(10%)</span>
            <span>{formatCurrency(Math.floor(total * 0.1))}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>合計</span>
            <span>{formatCurrency(Math.floor(total * 1.1))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
