"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteDraft,
  markInventoriesWithInvoice,
  type InventoryRecord,
} from "@/lib/demo-data/demoInventory";
import { addPurchaseInvoice, generateInvoiceId } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoice, PurchaseInvoiceItem } from "@/types/purchaseInvoices";

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

type BaseRow = {
  inventoryId: string;
  maker: string;
  machineName: string;
  type: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  remainingDebt?: number;
  note?: string;
  storeName?: string;
  removalDate?: string;
};

type Props = {
  type: PurchaseInvoice["invoiceType"];
  draftId: string;
  inventories: InventoryRecord[];
};

const yellowInput =
  "w-full bg-amber-100 border border-black px-2 py-1 text-[13px] leading-tight focus:outline-none";

const framedLabel = "bg-cyan-50 px-2 py-1 text-[12px] font-semibold text-neutral-900";
const primaryButton =
  "rounded-none border-2 border-amber-600 bg-amber-300 px-5 py-2 text-sm font-bold text-neutral-900 shadow-[3px_3px_0_rgba(0,0,0,0.35)]";
const secondaryButton =
  "rounded-none border-2 border-neutral-500 bg-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-900 shadow-[3px_3px_0_rgba(0,0,0,0.35)]";

export function PurchaseInvoiceLegacyForm({ type, draftId, inventories }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<BaseRow[]>([]);
  const [staff, setStaff] = useState("担当A");
  const [issuedDate, setIssuedDate] = useState(toDateInputValue(new Date()));
  const [paymentDate, setPaymentDate] = useState("");
  const [warehousingDate, setWarehousingDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [applicationFlag, setApplicationFlag] = useState("-");

  useEffect(() => {
    const defaults = inventories.map<BaseRow>((item) => ({
      inventoryId: item.id,
      maker: item.maker ?? "",
      machineName: item.machineName ?? item.model ?? "",
      type: item.type ?? item.deviceType ?? "",
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      amount: (item.quantity ?? 1) * (item.unitPrice ?? 0),
      remainingDebt: item.remainingDebt ?? 0,
      note: item.note ?? item.notes ?? "",
      storeName: item.supplierBranch ?? item.customFields?.storeName ?? "",
      removalDate: item.removalDate ?? item.removeDate ?? "",
    }));
    setRows(defaults.length > 0 ? defaults : [{
      inventoryId: "-",
      maker: "",
      machineName: "",
      type: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    }]);
  }, [inventories]);

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0), 0),
    [rows],
  );

  const handleChange = (index: number, key: keyof BaseRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated: BaseRow = {
          ...row,
          [key]: key === "quantity" || key === "unitPrice" ? Number(value) || 0 : value,
        } as BaseRow;
        if (key === "quantity" || key === "unitPrice") {
          updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
        }
        return updated;
      }),
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        inventoryId: "-",
        maker: "",
        machineName: "",
        type: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const handleSubmit = () => {
    if (!window.confirm("よろしいですか？")) return;

    const now = new Date();
    const invoiceId = generateInvoiceId(type);
    const items: PurchaseInvoiceItem[] = rows.map((row) => ({
      inventoryId: row.inventoryId,
      maker: row.maker,
      machineName: row.machineName,
      type: row.type,
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unitPrice) || 0,
      amount: row.amount,
      remainingDebt: row.remainingDebt,
      storeName: row.storeName,
      supplierName: inventories[0]?.supplier ?? inventories[0]?.supplierCorporate ?? undefined,
      note: row.note,
      extra: type === "hall" ? { removalDate: row.removalDate, storeName: row.storeName } : { applicationDate },
    }));

    const invoice: PurchaseInvoice = {
      invoiceId,
      invoiceType: type,
      createdAt: now.toISOString(),
      issuedDate,
      partnerName: inventories[0]?.supplier ?? inventories[0]?.supplierCorporate ?? "",
      staff,
      inventoryIds: inventories.map((item) => item.id),
      items,
      totalAmount,
      formInput: {
        paymentDate,
        warehousingDate,
        remarks,
        applicationFlag,
        applicationDate,
        issuedDate,
      },
      displayTitle: rows[0]?.machineName || "購入伝票",
    };

    addPurchaseInvoice(invoice);
    markInventoriesWithInvoice(invoice.inventoryIds, invoice.invoiceId);
    deleteDraft(draftId);
    alert("登録完了");
    router.push(`/inventory/purchase-invoice/list`);
  };

  const headerTitle = type === "vendor" ? "購入伝票登録（業者）" : "購入伝票登録（ホール）";
  const totalLabel = totalAmount.toLocaleString("ja-JP");
  const taxAmount = Math.floor(totalAmount * 0.1);
  const supplierName = inventories[0]?.supplier ?? inventories[0]?.supplierCorporate ?? "";

  return (
    <div className="min-h-screen bg-gray-200 px-3 py-6 text-[13px] text-neutral-900">
      <div className="mx-auto max-w-6xl border-[6px] border-cyan-700 bg-cyan-100 p-2 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
        <div className="border-2 border-cyan-800 bg-white p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-lg font-bold text-neutral-900">
                <span className="inline-block h-3.5 w-3.5 rounded-full bg-green-600" />
                <span>{headerTitle}</span>
              </div>
              <div className="border-b border-dashed border-neutral-400" />
              <div className="flex items-center gap-3 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-orange-700">宛先</span>
                  <span className="border border-black px-2 py-1 text-[13px] leading-tight text-orange-800">{supplierName || ""} 御中</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 text-sm font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-neutral-700">伝票日付</span>
                <div className="flex items-stretch">
                  <input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className={`${yellowInput} w-36 rounded-none text-center`}
                  />
                  <span className="border border-black bg-neutral-100 px-2 py-1 text-[12px]">▼</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="border border-orange-500 bg-orange-100 px-2 py-1 text-xs text-orange-900">担当</span>
                <select
                  value={staff}
                  onChange={(e) => setStaff(e.target.value)}
                  className={`${yellowInput} w-32 rounded-none`}
                >
                  {["担当A", "担当B", "担当C"].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border border-black bg-cyan-50 px-3 py-2 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleSubmit} className={primaryButton}>
                確認（登録）
              </button>
              <button type="button" onClick={() => router.back()} className={secondaryButton}>
                戻る
              </button>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-neutral-800">
              <span>行を追加します</span>
              <button
                type="button"
                onClick={handleAddRow}
                className="rounded-none border-2 border-amber-600 bg-amber-200 px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
              >
                行追加
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-2 border border-black p-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
              {type === "vendor" ? (
                <>
                  <div className="flex items-center gap-2">
                    <span>申請適用</span>
                    <input
                      type="text"
                      value={applicationFlag}
                      onChange={(e) => setApplicationFlag(e.target.value)}
                      className={`${yellowInput} w-28 rounded-none text-center`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>申請日</span>
                    <input
                      type="date"
                      value={applicationDate}
                      onChange={(e) => setApplicationDate(e.target.value)}
                      className={`${yellowInput} w-36 rounded-none text-center`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span>支払日</span>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={`${yellowInput} w-36 rounded-none text-center`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>入庫日</span>
                    <input
                      type="date"
                      value={warehousingDate}
                      onChange={(e) => setWarehousingDate(e.target.value)}
                      className={`${yellowInput} w-36 rounded-none text-center`}
                    />
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <span>合計金額</span>
                <span className="border border-black bg-white px-3 py-1 text-base font-bold">{totalLabel}</span>
              </div>
            </div>
          </div>

          <div className="mb-3 overflow-x-auto">
            <table className="min-w-full border border-black text-center text-[12px]" style={{ borderCollapse: "collapse" }}>
              <thead className="bg-cyan-50 text-[12px] font-semibold">
                <tr>
                  {type === "hall" && <th className="border border-black px-2 py-2">撤去日</th>}
                  {type === "hall" && <th className="border border-black px-2 py-2">店舗名</th>}
                  <th className="border border-black px-2 py-2">メーカー名</th>
                  <th className="border border-black px-2 py-2">商品名</th>
                  <th className="border border-black px-2 py-2">タイプ</th>
                  <th className="border border-black px-2 py-2">数量</th>
                  <th className="border border-black px-2 py-2">単価</th>
                  <th className="border border-black px-2 py-2">金額</th>
                  <th className="border border-black px-2 py-2">残債</th>
                  {type === "vendor" && <th className="border border-black px-2 py-2">申請適用</th>}
                  {type === "vendor" && <th className="border border-black px-2 py-2">申請日</th>}
                  <th className="border border-black px-2 py-2">商品補足</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.inventoryId}-${index}`} className="bg-white">
                    {type === "hall" && (
                      <td className="border border-black px-1 py-1">
                        <input
                          type="date"
                          value={row.removalDate ?? ""}
                          onChange={(e) => handleChange(index, "removalDate", e.target.value)}
                          className={`${yellowInput} rounded-none text-center`}
                        />
                      </td>
                    )}
                    {type === "hall" && (
                      <td className="border border-black px-1 py-1">
                        <input
                          type="text"
                          value={row.storeName ?? ""}
                          onChange={(e) => handleChange(index, "storeName", e.target.value)}
                          className={`${yellowInput} rounded-none`}
                        />
                      </td>
                    )}
                    <td className="border border-black px-1 py-1">
                      <input
                        type="text"
                        value={row.maker}
                        onChange={(e) => handleChange(index, "maker", e.target.value)}
                        className={`${yellowInput} rounded-none`}
                      />
                    </td>
                    <td className="border border-black px-1 py-1">
                      <input
                        type="text"
                        value={row.machineName}
                        onChange={(e) => handleChange(index, "machineName", e.target.value)}
                        className={`${yellowInput} rounded-none`}
                      />
                    </td>
                    <td className="border border-black px-1 py-1">
                      <input
                        type="text"
                        value={row.type}
                        onChange={(e) => handleChange(index, "type", e.target.value)}
                        className={`${yellowInput} rounded-none`}
                      />
                    </td>
                    <td className="border border-black px-1 py-1">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleChange(index, "quantity", e.target.value)}
                        className={`${yellowInput} rounded-none text-right`}
                      />
                    </td>
                    <td className="border border-black px-1 py-1">
                      <input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => handleChange(index, "unitPrice", e.target.value)}
                        className={`${yellowInput} rounded-none text-right`}
                      />
                    </td>
                    <td className="border border-black px-1 py-1 bg-amber-50 text-right font-semibold">
                      {row.amount.toLocaleString("ja-JP")}
                    </td>
                    <td className="border border-black px-1 py-1">
                      <input
                        type="number"
                        value={row.remainingDebt ?? 0}
                        onChange={(e) => handleChange(index, "remainingDebt", e.target.value)}
                        className={`${yellowInput} rounded-none text-right`}
                      />
                    </td>
                    {type === "vendor" && (
                      <td className="border border-black px-1 py-1">
                        <input
                          type="text"
                          value={applicationFlag}
                          onChange={(e) => setApplicationFlag(e.target.value)}
                          className={`${yellowInput} rounded-none text-center`}
                        />
                      </td>
                    )}
                    {type === "vendor" && (
                      <td className="border border-black px-1 py-1">
                        <input
                          type="date"
                          value={applicationDate}
                          onChange={(e) => setApplicationDate(e.target.value)}
                          className={`${yellowInput} rounded-none text-center`}
                        />
                      </td>
                    )}
                    <td className="border border-black px-1 py-1">
                      <input
                        type="text"
                        value={row.note ?? ""}
                        onChange={(e) => handleChange(index, "note", e.target.value)}
                        className={`${yellowInput} rounded-none`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="border-2 border-black bg-amber-50 p-3">
              <div className="mb-2 text-sm font-semibold">備考 / 依頼事項</div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="h-28 w-full border border-black bg-amber-100 p-2 text-[13px] leading-tight focus:outline-none"
              />
            </div>
            <div className="border-2 border-black bg-amber-50 p-3">
              <div className="mb-2 text-sm font-semibold">番号 / 補足</div>
              <textarea
                value={applicationFlag === "-" ? "" : applicationFlag}
                onChange={(e) => setApplicationFlag(e.target.value)}
                className="h-28 w-full border border-black bg-amber-100 p-2 text-[13px] leading-tight focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <div className="flex-1 space-y-2 border-2 border-black p-2">
              <div className={framedLabel}>商品→先</div>
              <div className="grid grid-cols-3 gap-2 border border-black p-2 text-[12px]">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="font-semibold">商品受取り方法</div>
                    <select className={`${yellowInput} rounded-none`} defaultValue="">
                      <option value="">選択してください</option>
                      <option>配送</option>
                      <option>引き取り</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold">日付</div>
                    <input type="date" className={`${yellowInput} rounded-none text-center`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="font-semibold">入庫日</div>
                    <div className="flex gap-1">
                      <input type="date" className={`${yellowInput} rounded-none text-center`} />
                      <select className={`${yellowInput} w-20 rounded-none`} defaultValue="">
                        <option value="">指定なし</option>
                        <option>午前</option>
                        <option>午後</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold">住所</div>
                  <textarea
                    className="h-28 w-full border border-black bg-orange-100 p-2 text-[12px] leading-tight focus:outline-none"
                    defaultValue={[
                      supplierName,
                      inventories[0]?.supplierAddress ?? "",
                      inventories[0]?.supplierPhone ? `TEL: ${inventories[0]?.supplierPhone}` : "",
                    ]
                      .filter(Boolean)
                      .join("\n")}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-2 border-2 border-black p-2">
              <div className={framedLabel}>売契→先</div>
              <div className="grid grid-cols-3 gap-2 border border-black p-2 text-[12px]">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="font-semibold">売契受取り方法</div>
                    <select className={`${yellowInput} rounded-none`} defaultValue="">
                      <option value="">選択してください</option>
                      <option>配送</option>
                      <option>引き取り</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold">日付</div>
                    <input type="date" className={`${yellowInput} rounded-none text-center`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="font-semibold">到着日</div>
                    <div className="flex gap-1">
                      <input type="date" className={`${yellowInput} rounded-none text-center`} />
                      <select className={`${yellowInput} w-20 rounded-none`} defaultValue="">
                        <option value="">指定なし</option>
                        <option>午前</option>
                        <option>午後</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold">住所</div>
                  <textarea
                    className="h-28 w-full border border-black bg-orange-100 p-2 text-[12px] leading-tight focus:outline-none"
                    defaultValue=""
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <div className="flex-1 space-y-2 border-2 border-black p-2">
              <div className={framedLabel}>売主様捺印欄</div>
              <div className="grid grid-cols-[1fr_1fr] gap-2 border border-black p-3 text-[12px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-20 font-semibold">住所</span>
                    <span className="flex-1 border-b border-black" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 font-semibold">会社名</span>
                    <span className="flex-1 border-b border-black" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 font-semibold">電話番号</span>
                    <span className="flex-1 border-b border-black" />
                  </div>
                </div>
                <div className="flex items-center justify-center border border-black bg-amber-50 text-lg font-bold">印</div>
              </div>
            </div>

            <div className="w-full md:w-80">
              <div className="border-2 border-black bg-cyan-50 p-3 text-center text-sm font-semibold leading-6">
                <div>小計　¥{totalLabel}</div>
                <div>消費税（10%）　¥{taxAmount.toLocaleString("ja-JP")}</div>
                <div>運送保険（税込）　¥0</div>
                <div className="border-t border-black pt-2 text-base font-bold">合計金額　¥{(totalAmount + taxAmount).toLocaleString("ja-JP")}</div>
                <div className="mt-3 flex items-center justify-between border border-black bg-white px-2 py-1 text-[12px]">
                  <span>支払日</span>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`${yellowInput} w-36 rounded-none text-center`}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between border border-black bg-white px-2 py-1 text-[12px]">
                  <span>請求書原本</span>
                  <select className={`${yellowInput} w-28 rounded-none`} defaultValue="要">
                    <option>要</option>
                    <option>不要</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-2 border-black bg-amber-50 p-4 text-center text-sm font-semibold leading-6">
            <div>リアルタイムの在庫確認ができます</div>
            <div>www.pachimart.jp</div>
            <div>E-mail: sales@pachimart.jp</div>
            <div>FAX 06-4708-8286 →</div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button type="button" onClick={handleSubmit} className={primaryButton}>
              確認
            </button>
            <button type="button" onClick={() => router.back()} className={secondaryButton}>
              戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseInvoiceLegacyForm;
