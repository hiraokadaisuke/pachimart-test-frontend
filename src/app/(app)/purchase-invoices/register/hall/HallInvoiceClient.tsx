"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { loadSimpleInventory } from "@/lib/demo-data/inventory";
import { addPurchaseInvoice, generateInvoiceId } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoiceItem, SimpleInventory } from "@/types/purchaseInvoices";

type ItemInput = {
  inventoryId: string;
  quantity: number;
  unitPrice: number;
  removalDate: string;
  storeName: string;
  note: string;
};

type FormState = {
  issuedDate: string;
  staff: string;
  hallName: string;
  shopName: string;
  address: string;
  tel: string;
  paymentDate: string;
  arrivalDate: string;
  memo: string;
};

const defaultForm: FormState = {
  issuedDate: "",
  staff: "",
  hallName: "",
  shopName: "",
  address: "",
  tel: "",
  paymentDate: "",
  arrivalDate: "",
  memo: "",
};

export default function HallInvoiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ids = useMemo(() => {
    const paramValue = searchParams?.get("ids") ?? "";
    return paramValue.split(",").filter(Boolean);
  }, [searchParams]);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [inventory, setInventory] = useState<SimpleInventory[]>([]);
  const [itemInputs, setItemInputs] = useState<ItemInput[]>([]);

  useEffect(() => {
    const loaded = loadSimpleInventory();
    const selected = loaded.filter((item) => ids.includes(item.id));
    setInventory(selected);
    setItemInputs(
      selected.map((item) => ({
        inventoryId: item.id,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        removalDate: "",
        storeName: "",
        note: "",
      })),
    );
  }, [ids]);

  const items = useMemo<PurchaseInvoiceItem[]>(() => {
    return inventory.map((item) => {
      const detail = itemInputs.find((input) => input.inventoryId === item.id);
      const quantity = detail?.quantity ?? item.quantity ?? 1;
      const unitPrice = detail?.unitPrice ?? item.unitPrice ?? 0;
      const amount = quantity * unitPrice;
      return {
        inventoryId: item.id,
        maker: item.maker,
        machineName: item.machineName,
        type: item.type,
        quantity,
        unitPrice,
        amount,
        extra: {
          removalDate: detail?.removalDate,
          storeName: detail?.storeName,
        },
        note: detail?.note,
      } satisfies PurchaseInvoiceItem;
    });
  }, [inventory, itemInputs]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount, 0),
    [items],
  );

  const handleItemChange = (inventoryId: string, field: keyof ItemInput, value: string | number) => {
    setItemInputs((prev) =>
      prev.map((input) => (input.inventoryId === inventoryId ? { ...input, [field]: value } : input)),
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inventory.length === 0) {
      alert("在庫が選択されていません");
      return;
    }

    const payload = {
      invoiceId: generateInvoiceId("hall"),
      invoiceType: "hall" as const,
      createdAt: new Date().toISOString(),
      issuedDate: form.issuedDate,
      partnerName: form.hallName,
      inventoryIds: inventory.map((item) => item.id),
      items,
      totalAmount,
    };

    addPurchaseInvoice(payload);
    router.push("/purchase-invoices");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">ホール伝票登録</h1>
          <p className="text-sm text-neutral-600">ホール向けの伝票を入力し、保存します。</p>
        </div>
        <Link
          href="/purchase-invoices/create"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm"
        >
          ← 作成画面へ戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">伝票発行日</span>
            <input
              type="date"
              value={form.issuedDate}
              onChange={(event) => setForm({ ...form, issuedDate: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">担当</span>
            <input
              value={form.staff}
              onChange={(event) => setForm({ ...form, staff: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">ホール名</span>
            <input
              value={form.hallName}
              onChange={(event) => setForm({ ...form, hallName: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">導入店舗名</span>
            <input
              value={form.shopName}
              onChange={(event) => setForm({ ...form, shopName: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">住所</span>
            <input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">電話番号</span>
            <input
              value={form.tel}
              onChange={(event) => setForm({ ...form, tel: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">支払日</span>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">入庫日</span>
            <input
              type="date"
              value={form.arrivalDate}
              onChange={(event) => setForm({ ...form, arrivalDate: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="md:col-span-2 space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">備考</span>
            <textarea
              value={form.memo}
              onChange={(event) => setForm({ ...form, memo: event.target.value })}
              className="min-h-[80px] w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-3">撤去日</th>
                <th className="px-3 py-3">店舗名</th>
                <th className="px-3 py-3">メーカー</th>
                <th className="px-3 py-3">機種名</th>
                <th className="px-3 py-3">タイプ</th>
                <th className="px-3 py-3 text-right">数量</th>
                <th className="px-3 py-3 text-right">単価</th>
                <th className="px-3 py-3 text-right">金額</th>
                <th className="px-3 py-3">商品補足</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-sm text-neutral-600">
                    選択された在庫がありません
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const detail = itemInputs.find((input) => input.inventoryId === item.inventoryId);
                  return (
                    <tr key={item.inventoryId} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <input
                          type="date"
                          value={detail?.removalDate ?? ""}
                          onChange={(event) =>
                            handleItemChange(item.inventoryId, "removalDate", event.target.value)
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={detail?.storeName ?? ""}
                          onChange={(event) => handleItemChange(item.inventoryId, "storeName", event.target.value)}
                          className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3 text-neutral-800">{item.maker ?? "-"}</td>
                      <td className="px-3 py-3 text-neutral-800">{item.machineName ?? "-"}</td>
                      <td className="px-3 py-3 text-neutral-800">{item.type ?? "-"}</td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={1}
                          value={detail?.quantity ?? 1}
                          onChange={(event) =>
                            handleItemChange(item.inventoryId, "quantity", Number(event.target.value) || 0)
                          }
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right shadow-sm focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          value={detail?.unitPrice ?? 0}
                          onChange={(event) =>
                            handleItemChange(item.inventoryId, "unitPrice", Number(event.target.value) || 0)
                          }
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right shadow-sm focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-3 text-right text-neutral-800">{item.amount.toLocaleString()}円</td>
                      <td className="px-3 py-3">
                        <input
                          value={detail?.note ?? ""}
                          onChange={(event) => handleItemChange(item.inventoryId, "note", event.target.value)}
                          className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50 text-sm font-semibold text-neutral-800">
              <tr>
                <td colSpan={6} className="px-3 py-3 text-right">
                  合計
                </td>
                <td className="px-3 py-3 text-right">{totalAmount.toLocaleString()}円</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/purchase-invoices/create"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm"
          >
            戻る
          </Link>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
          >
            確認して保存
          </button>
        </div>
      </form>
    </div>
  );
}
