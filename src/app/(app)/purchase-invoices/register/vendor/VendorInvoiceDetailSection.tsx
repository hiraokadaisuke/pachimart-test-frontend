"use client";

import Link from "next/link";

import {
  APPLICATION_OPTIONS,
  INVOICE_ORIGINAL_OPTIONS,
  PRODUCT_NAME_OPTIONS,
  REMAINING_DEBT_OPTIONS,
} from "./vendorInvoiceConstants";
import type { DraftRow, FormState, InvoiceRow } from "./vendorInvoiceTypes";

type VendorInvoiceDetailSectionProps = {
  form: FormState;
  rows: InvoiceRow[];
  draftRow: DraftRow;
  subtotal: number;
  tax: number;
  totalAmount: number;
  onFormChange: (next: Partial<FormState>) => void;
  onDraftChange: (field: keyof DraftRow, value: string | number) => void;
  onAddRow: () => void;
  onRowChange: (rowId: string, field: keyof DraftRow, value: string | number) => void;
  onRemoveRow: (rowId: string) => void;
};

export default function VendorInvoiceDetailSection({
  form,
  rows,
  draftRow,
  subtotal,
  tax,
  totalAmount,
  onFormChange,
  onDraftChange,
  onAddRow,
  onRowChange,
  onRemoveRow,
}: VendorInvoiceDetailSectionProps) {
  const draftAmount = (Number(draftRow.quantity) || 0) * (Number(draftRow.unitPrice) || 0);

  return (
    <div className="space-y-2">
      <div className="grid gap-0 border border-slate-300 bg-sky-50 text-xs lg:grid-cols-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-300 px-2 py-1.5 font-semibold text-neutral-900 lg:border-b-0 lg:border-r">
          <span className="text-[11px] text-slate-600">合計金額</span>
          <span className="text-sm">{totalAmount.toLocaleString()}円</span>
        </div>
        <label className="flex items-center justify-between gap-2 border-b border-slate-300 px-2 py-1.5 text-neutral-800 lg:border-b-0 lg:border-r">
          <span className="text-[11px] font-semibold text-slate-600">支払日</span>
          <input
            type="date"
            value={form.paymentDate}
            onChange={(event) => onFormChange({ paymentDate: event.target.value })}
            className="h-6 w-32 border border-slate-300 bg-yellow-100 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center justify-between gap-2 px-2 py-1.5 text-neutral-800">
          <span className="text-[11px] font-semibold text-slate-600">入庫日</span>
          <input
            type="date"
            value={form.arrivalDate}
            onChange={(event) => onFormChange({ arrivalDate: event.target.value })}
            className="h-6 w-32 border border-slate-300 bg-yellow-100 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-sky-50 px-2 py-1 text-xs">
        <div className="flex items-center gap-2 font-semibold text-neutral-700">
          <span>行を追加します</span>
          <button
            type="button"
            onClick={onAddRow}
            className="border border-amber-500 bg-amber-400 px-2 py-0.5 text-xs font-semibold text-neutral-900 hover:bg-amber-300"
          >
            行追加
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="border border-sky-600 bg-sky-600 px-3 py-0.5 text-xs font-semibold text-white hover:bg-sky-500"
          >
            確認
          </button>
          <Link
            href="/purchase-invoices/create"
            className="border border-slate-300 bg-white px-3 py-0.5 text-xs font-semibold text-neutral-800"
          >
            戻る
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-300 bg-white">
        <table className="min-w-[1100px] divide-y divide-slate-200 text-xs">
          <thead className="bg-sky-50 text-left font-semibold text-slate-700">
            <tr>
              <th className="w-[120px] px-2 py-1.5">メーカー名</th>
              <th className="w-[180px] px-2 py-1.5">商品名</th>
              <th className="w-[80px] px-2 py-1.5">タイプ</th>
              <th className="w-[60px] px-2 py-1.5 text-right">数量</th>
              <th className="w-[90px] px-2 py-1.5 text-right">単価</th>
              <th className="w-[90px] px-2 py-1.5 text-right">金額</th>
              <th className="w-[70px] px-2 py-1.5">残債</th>
              <th className="w-[130px] px-2 py-1.5">申請遊商</th>
              <th className="w-[110px] px-2 py-1.5">申請日</th>
              <th className="px-2 py-1.5">
                商品補足
                <span className="block text-[10px] font-normal text-slate-500">
                  （印刷書類全てに表示されます）
                </span>
              </th>
              <th className="w-[60px] px-2 py-1.5 text-center">削除</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="bg-sky-50">
              <td className="px-2 py-1.5 text-neutral-500">-</td>
              <td className="px-2 py-1.5">
                <select
                  value={draftRow.productName}
                  onChange={(event) => onDraftChange("productName", event.target.value)}
                  className="h-6 w-full border border-slate-300 bg-white px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                >
                  {PRODUCT_NAME_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1.5 text-neutral-500">-</td>
              <td className="px-2 py-1.5 text-right">
                <input
                  type="number"
                  min={0}
                  value={draftRow.quantity}
                  onChange={(event) => onDraftChange("quantity", Number(event.target.value) || 0)}
                  className="h-6 w-full border border-slate-300 bg-yellow-100 px-1 text-right text-[11px] focus:border-sky-500 focus:outline-none"
                />
              </td>
              <td className="px-2 py-1.5 text-right">
                <input
                  type="number"
                  min={0}
                  value={draftRow.unitPrice}
                  onChange={(event) => onDraftChange("unitPrice", Number(event.target.value) || 0)}
                  className="h-6 w-full border border-slate-300 bg-yellow-100 px-1 text-right text-[11px] focus:border-sky-500 focus:outline-none"
                />
              </td>
              <td className="px-2 py-1.5 text-right text-neutral-600">
                {draftAmount ? `${draftAmount.toLocaleString()}円` : "-"}
              </td>
              <td className="px-2 py-1.5">
                <select
                  value={draftRow.remainingDebt}
                  onChange={(event) => onDraftChange("remainingDebt", event.target.value)}
                  className="h-6 w-full border border-slate-300 bg-white px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                >
                  {REMAINING_DEBT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <select
                  value={draftRow.applicationRoute}
                  onChange={(event) => onDraftChange("applicationRoute", event.target.value)}
                  className="h-6 w-full border border-slate-300 bg-white px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                >
                  {APPLICATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="date"
                  value={draftRow.applicationDate}
                  onChange={(event) => onDraftChange("applicationDate", event.target.value)}
                  className="h-6 w-full border border-slate-300 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  value={draftRow.note}
                  onChange={(event) => onDraftChange("note", event.target.value)}
                  className="h-6 w-full border border-slate-300 bg-yellow-100 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                />
              </td>
              <td className="px-2 py-1.5 text-center text-neutral-400">-</td>
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
                  <tr key={row.id} className="hover:bg-sky-50">
                    <td className="px-2 py-1.5 text-neutral-800">{row.maker || "-"}</td>
                    <td className="px-2 py-1.5 text-neutral-800">{row.machineName || row.productName}</td>
                    <td className="px-2 py-1.5 text-neutral-800">{row.type || "-"}</td>
                    <td className="px-2 py-1.5 text-right">
                      <input
                        type="number"
                        min={0}
                        value={row.quantity}
                        onChange={(event) => onRowChange(row.id, "quantity", Number(event.target.value) || 0)}
                        className="h-6 w-full border border-slate-300 bg-yellow-100 px-1 text-right text-[11px] focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <input
                        type="number"
                        min={0}
                        value={row.unitPrice}
                        onChange={(event) => onRowChange(row.id, "unitPrice", Number(event.target.value) || 0)}
                        className="h-6 w-full border border-slate-300 bg-yellow-100 px-1 text-right text-[11px] focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right text-neutral-800">{amount.toLocaleString()}円</td>
                    <td className="px-2 py-1.5">
                      <select
                        value={row.remainingDebt}
                        onChange={(event) => onRowChange(row.id, "remainingDebt", event.target.value)}
                        className="h-6 w-full border border-slate-300 bg-white px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                      >
                        {REMAINING_DEBT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={row.applicationRoute}
                        onChange={(event) => onRowChange(row.id, "applicationRoute", event.target.value)}
                        className="h-6 w-full border border-slate-300 bg-white px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                      >
                        {APPLICATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={row.applicationDate}
                        onChange={(event) => onRowChange(row.id, "applicationDate", event.target.value)}
                        className="h-6 w-full border border-slate-300 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={row.note}
                        onChange={(event) => onRowChange(row.id, "note", event.target.value)}
                        className="h-6 w-full border border-slate-300 bg-yellow-100 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveRow(row.id)}
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

      <div className="grid gap-2 lg:grid-cols-[1.4fr_1fr]">
        <label className="space-y-1 text-xs text-neutral-800">
          <span className="font-semibold">備考（印刷書類全てに表示されます）</span>
          <textarea
            value={form.memo}
            onChange={(event) => onFormChange({ memo: event.target.value })}
            className="min-h-[110px] w-full border border-slate-300 bg-yellow-100 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
          />
        </label>

        <div className="space-y-2">
          <div className="border border-slate-300 bg-white text-xs text-neutral-800">
            <div className="flex items-center justify-between border-b border-slate-300 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
              <span>計算枠</span>
              <span>税込</span>
            </div>
            <div className="space-y-1 px-2 py-1.5">
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
                  onChange={(event) => onFormChange({ shippingInsurance: event.target.value })}
                  className="h-6 w-24 border border-slate-300 bg-yellow-100 px-1 text-right text-[11px] focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between border-t border-slate-300 pt-1 text-sm font-bold">
                <span>合計金額</span>
                <span>{totalAmount.toLocaleString()}円</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 bg-white p-2 text-xs text-neutral-800">
            <label className="flex items-center gap-2">
              <span className="w-14 text-[11px] font-semibold text-slate-600">販売先</span>
              <input
                value={form.salesDestination}
                onChange={(event) => onFormChange({ salesDestination: event.target.value })}
                placeholder="販売先を入力"
                className="h-6 flex-1 border border-slate-300 bg-yellow-100 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
              />
              <button
                type="button"
                className="h-6 border border-slate-300 bg-slate-100 px-2 text-[11px] font-semibold text-slate-700"
              >
                販売先検索
              </button>
            </label>
            <label className="mt-1 flex items-center gap-2">
              <span className="w-14 text-[11px] font-semibold text-slate-600">支払日</span>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(event) => onFormChange({ paymentDate: event.target.value })}
                className="h-6 w-32 border border-slate-300 bg-yellow-100 px-1 text-[11px] focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="mt-1 flex items-center gap-2">
              <span className="w-14 text-[11px] font-semibold text-slate-600">請求書原本</span>
              <select
                value={form.invoiceOriginal}
                onChange={(event) => onFormChange({ invoiceOriginal: event.target.value })}
                className="h-6 w-24 border border-slate-300 bg-white px-1 text-[11px] focus:border-sky-500 focus:outline-none"
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

      <div className="min-h-[80px] border border-slate-200 bg-white" aria-hidden="true" />
    </div>
  );
}
