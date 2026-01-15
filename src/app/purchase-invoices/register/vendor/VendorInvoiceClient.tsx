"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { loadSimpleInventory } from "@/lib/demo-data/inventory";
import { addPurchaseInvoice, generateInvoiceId } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoiceItem, SimpleInventory } from "@/types/purchaseInvoices";

type DraftRow = {
  productName: string;
  quantity: number;
  unitPrice: number;
  remainingDebt: string;
  applicationRoute: string;
  applicationDate: string;
  note: string;
};

type InvoiceRow = DraftRow & {
  id: string;
  inventoryId: string;
  maker?: string;
  machineName?: string;
  type?: string;
};

type FormState = {
  issuedDate: string;
  staff: string;
  supplierName: string;
  supplierAddress: string;
  tel: string;
  fax: string;
  paymentDate: string;
  arrivalDate: string;
  memo: string;
  salesDestination: string;
  invoiceOriginal: string;
  shippingInsurance: string;
};

const defaultForm: FormState = {
  issuedDate: "",
  staff: "",
  supplierName: "",
  supplierAddress: "",
  tel: "",
  fax: "",
  paymentDate: "",
  arrivalDate: "",
  memo: "",
  salesDestination: "",
  invoiceOriginal: "--",
  shippingInsurance: "",
};

const PRODUCT_NAME_OPTIONS = ["商品名", "ダンボール代", "手数料", "保険料", "その他", "書類代"];
const APPLICATION_OPTIONS = [
  "--",
  "北海道",
  "東北",
  "東日本（本部）",
  "中部",
  "関西",
  "中国",
  "四国",
  "九州",
  "用途限定",
  "新台用",
  "下取り",
];
const REMAINING_DEBT_OPTIONS = ["--", "要", "不要"];
const INVOICE_ORIGINAL_OPTIONS = ["--", "要", "不要"];

const DEFAULT_DRAFT_ROW: DraftRow = {
  productName: PRODUCT_NAME_OPTIONS[0],
  quantity: 0,
  unitPrice: 0,
  remainingDebt: REMAINING_DEBT_OPTIONS[0],
  applicationRoute: APPLICATION_OPTIONS[0],
  applicationDate: "",
  note: "",
};

export default function VendorInvoiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ids = useMemo(() => {
    const paramValue = searchParams?.get("ids") ?? "";
    return paramValue.split(",").filter(Boolean);
  }, [searchParams]);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [inventory, setInventory] = useState<SimpleInventory[]>([]);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [draftRow, setDraftRow] = useState<DraftRow>(DEFAULT_DRAFT_ROW);

  useEffect(() => {
    const loaded = loadSimpleInventory();
    const selected = loaded.filter((item) => ids.includes(item.id));
    setInventory(selected);
    setRows(
      selected.map((item) => ({
        id: item.id,
        inventoryId: item.id,
        maker: item.maker,
        machineName: item.machineName,
        type: item.type,
        productName: DEFAULT_DRAFT_ROW.productName,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        remainingDebt: DEFAULT_DRAFT_ROW.remainingDebt,
        applicationRoute: DEFAULT_DRAFT_ROW.applicationRoute,
        applicationDate: "",
        note: "",
      })),
    );
  }, [ids]);

  const items = useMemo<PurchaseInvoiceItem[]>(() => {
    return rows.map((row) => {
      const quantity = Number(row.quantity) || 0;
      const unitPrice = Number(row.unitPrice) || 0;
      const amount = quantity * unitPrice;
      return {
        inventoryId: row.inventoryId,
        maker: row.maker,
        machineName: row.machineName ?? row.productName,
        type: row.type,
        quantity,
        unitPrice,
        amount,
        extra: {
          remainingDebt: row.remainingDebt,
          applicationRoute: row.applicationRoute,
          applicationDate: row.applicationDate,
          productName: row.productName,
        },
        note: row.note,
      } satisfies PurchaseInvoiceItem;
    });
  }, [rows]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [items],
  );
  const tax = Math.floor(subtotal * 0.1);
  const shippingInsurance = Number(form.shippingInsurance) || 0;
  const totalAmount = subtotal + tax + shippingInsurance;

  const handleRowChange = (rowId: string, field: keyof DraftRow, value: string | number) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const handleDraftChange = (field: keyof DraftRow, value: string | number) => {
    setDraftRow((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddRow = () => {
    const fallbackId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : fallbackId;
    setRows((prev) => [
      ...prev,
      {
        id,
        inventoryId: `manual-${id}`,
        maker: "",
        machineName: "",
        type: "",
        ...draftRow,
      },
    ]);
    setDraftRow(DEFAULT_DRAFT_ROW);
  };

  const handleRemoveRow = (rowId: string) => {
    if (!confirm("この行を削除しますか？")) return;
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inventory.length === 0) {
      alert("在庫が選択されていません");
      return;
    }

    const invoiceId = generateInvoiceId("vendor");
    const payload = {
      invoiceId,
      invoiceType: "vendor" as const,
      createdAt: new Date().toISOString(),
      issuedDate: form.issuedDate,
      partnerName: form.supplierName,
      staff: form.staff,
      inventoryIds: inventory.map((item) => item.id),
      items,
      totalAmount,
      formInput: {
        paymentDate: form.paymentDate,
        warehousingDate: form.arrivalDate,
        remarks: form.memo,
        salesDestination: form.salesDestination,
        invoiceOriginal: form.invoiceOriginal,
        shippingInsurance: form.shippingInsurance,
      },
    };

    addPurchaseInvoice(payload);
    router.push("/purchase-invoices");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <span className="inline-block h-4 w-4 rounded-full bg-green-600" />
          <span>購入伝票登録（業者）</span>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <span>伝票日付</span>
          <input
            type="date"
            value={form.issuedDate}
            onChange={(event) => setForm({ ...form, issuedDate: event.target.value })}
            className="h-8 w-40 rounded border border-slate-400 bg-yellow-100 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">担当</span>
            <input
              value={form.staff}
              onChange={(event) => setForm({ ...form, staff: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">仕入先名</span>
            <input
              value={form.supplierName}
              onChange={(event) => setForm({ ...form, supplierName: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">仕入先住所</span>
            <input
              value={form.supplierAddress}
              onChange={(event) => setForm({ ...form, supplierAddress: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">TEL</span>
            <input
              value={form.tel}
              onChange={(event) => setForm({ ...form, tel: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">FAX</span>
            <input
              value={form.fax}
              onChange={(event) => setForm({ ...form, fax: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>

        {/* ===== Detail Section (below seller/buyer) START ===== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <span>行を追加します</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="rounded border border-amber-500 bg-amber-400 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-amber-300"
              >
                行追加
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[1100px] divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-left font-semibold text-slate-700">
                <tr>
                  <th className="w-[120px] px-2 py-2">メーカー名</th>
                  <th className="w-[180px] px-2 py-2">商品名</th>
                  <th className="w-[80px] px-2 py-2">タイプ</th>
                  <th className="w-[60px] px-2 py-2 text-right">数量</th>
                  <th className="w-[90px] px-2 py-2 text-right">単価</th>
                  <th className="w-[90px] px-2 py-2 text-right">金額</th>
                  <th className="w-[70px] px-2 py-2">残債</th>
                  <th className="w-[130px] px-2 py-2">申請遊商</th>
                  <th className="w-[110px] px-2 py-2">申請日</th>
                  <th className="px-2 py-2">
                    商品補足
                    <span className="block text-[10px] font-normal text-slate-500">
                      （印刷書類全てに表示されます）
                    </span>
                  </th>
                  <th className="w-[60px] px-2 py-2 text-center">削除</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50">
                  <td className="px-2 py-2 text-neutral-500">-</td>
                  <td className="px-2 py-2">
                    <select
                      value={draftRow.productName}
                      onChange={(event) => handleDraftChange("productName", event.target.value)}
                      className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    >
                      {PRODUCT_NAME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 text-neutral-500">-</td>
                  <td className="px-2 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={draftRow.quantity}
                      onChange={(event) => handleDraftChange("quantity", Number(event.target.value) || 0)}
                      className="h-7 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      value={draftRow.unitPrice}
                      onChange={(event) => handleDraftChange("unitPrice", Number(event.target.value) || 0)}
                      className="h-7 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-neutral-600">-</td>
                  <td className="px-2 py-2">
                    <select
                      value={draftRow.remainingDebt}
                      onChange={(event) => handleDraftChange("remainingDebt", event.target.value)}
                      className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    >
                      {REMAINING_DEBT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={draftRow.applicationRoute}
                      onChange={(event) => handleDraftChange("applicationRoute", event.target.value)}
                      className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    >
                      {APPLICATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="date"
                      value={draftRow.applicationDate}
                      onChange={(event) => handleDraftChange("applicationDate", event.target.value)}
                      className="h-7 w-full rounded border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={draftRow.note}
                      onChange={(event) => handleDraftChange("note", event.target.value)}
                      className="h-7 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-center text-neutral-400">-</td>
                </tr>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-xs text-neutral-600">
                      選択された在庫がありません
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const amount = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2 text-neutral-800">{row.maker || "-"}</td>
                        <td className="px-2 py-2 text-neutral-800">{row.machineName || row.productName}</td>
                        <td className="px-2 py-2 text-neutral-800">{row.type || "-"}</td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={row.quantity}
                            onChange={(event) => handleRowChange(row.id, "quantity", Number(event.target.value) || 0)}
                            className="h-7 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={row.unitPrice}
                            onChange={(event) =>
                              handleRowChange(row.id, "unitPrice", Number(event.target.value) || 0)
                            }
                            className="h-7 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-right text-neutral-800">{amount.toLocaleString()}円</td>
                        <td className="px-2 py-2">
                          <select
                            value={row.remainingDebt}
                            onChange={(event) => handleRowChange(row.id, "remainingDebt", event.target.value)}
                            className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                          >
                            {REMAINING_DEBT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={row.applicationRoute}
                            onChange={(event) => handleRowChange(row.id, "applicationRoute", event.target.value)}
                            className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                          >
                            {APPLICATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={row.applicationDate}
                            onChange={(event) => handleRowChange(row.id, "applicationDate", event.target.value)}
                            className="h-7 w-full rounded border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.note}
                            onChange={(event) => handleRowChange(row.id, "note", event.target.value)}
                            className="h-7 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <label className="space-y-1 text-xs text-neutral-800">
              <span className="font-semibold">備考（印刷書類全てに表示されます）</span>
              <textarea
                value={form.memo}
                onChange={(event) => setForm({ ...form, memo: event.target.value })}
                className="min-h-[120px] w-full rounded border border-slate-300 bg-yellow-100 px-2 py-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
              />
            </label>

            <div className="space-y-3">
              <div className="space-y-2 rounded border border-slate-200 bg-white p-3 text-xs text-neutral-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[11px] font-semibold text-slate-600">
                  <span>計算枠</span>
                  <span>税込</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>小計</span>
                    <span className="font-semibold">{subtotal.toLocaleString()}円</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>消費税（10%）</span>
                    <span className="font-semibold">{tax.toLocaleString()}円</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>運送保険（税込）</span>
                    <input
                      type="number"
                      min={0}
                      value={form.shippingInsurance}
                      onChange={(event) => setForm({ ...form, shippingInsurance: event.target.value })}
                      className="h-7 w-24 rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                    <span>合計金額</span>
                    <span>{totalAmount.toLocaleString()}円</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded border border-slate-200 bg-white p-3 text-xs text-neutral-800">
                <label className="flex items-center gap-2">
                  <span className="w-14 text-[11px] font-semibold text-slate-600">販売先</span>
                  <input
                    value={form.salesDestination}
                    onChange={(event) => setForm({ ...form, salesDestination: event.target.value })}
                    placeholder="販売先を入力"
                    className="h-7 flex-1 rounded border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="h-7 rounded border border-slate-300 bg-slate-100 px-2 text-[11px] font-semibold text-slate-700"
                  >
                    販売先検索
                  </button>
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-14 text-[11px] font-semibold text-slate-600">支払日</span>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}
                    className="h-7 w-[140px] rounded border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-14 text-[11px] font-semibold text-slate-600">入庫日</span>
                  <input
                    type="date"
                    value={form.arrivalDate}
                    onChange={(event) => setForm({ ...form, arrivalDate: event.target.value })}
                    className="h-7 w-[140px] rounded border border-slate-300 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-14 text-[11px] font-semibold text-slate-600">請求書原本</span>
                  <select
                    value={form.invoiceOriginal}
                    onChange={(event) => setForm({ ...form, invoiceOriginal: event.target.value })}
                    className="h-7 w-24 rounded border border-slate-300 bg-white px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                  >
                    {INVOICE_ORIGINAL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* ===== Detail Section (below seller/buyer) END ===== */}

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className="rounded border border-sky-600 bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-500"
          >
            確認
          </button>
          <Link
            href="/purchase-invoices/create"
            className="rounded border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-sm"
          >
            戻る
          </Link>
        </div>
      </form>
    </div>
  );
}
