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

type MachineRow = {
  kind: "machine";
  inventoryId: string;
  maker: string;
  machineName: string;
  type: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  applicationYusho: string;
  applicationDate: string;
  note: string;
};

type FeeRow = {
  kind: "fee";
  id: string;
  feeName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string;
};

type Row = MachineRow | FeeRow;

const STAFF_OPTIONS = ["デモユーザー", "上原", "田村", "佐藤"];
const FEE_OPTIONS = ["商品名", "ダンボール代", "手数料", "保険料", "その他", "書類代"];
const APPLICATION_YUSHO_OPTIONS = [
  "------",
  "北海道",
  "東北",
  "東日本(本部)",
  "中部",
  "関西",
  "中国",
  "四国",
  "九州",
  "用途設定",
  "新台用",
  "下取り",
];
const DELIVERY_METHOD_OPTIONS = ["配送", "引取", "未定"];

const triggerDatePicker = (input: HTMLInputElement) => {
  const withPicker = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof withPicker.showPicker === "function") {
    withPicker.showPicker();
  } else {
    input.focus();
  }
};

export default function VendorInvoicePage() {
  const params = useParams<{ draftId: string }>();
  const router = useRouter();

  const [issuedDate, setIssuedDate] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [staff, setStaff] = useState<string>(STAFF_OPTIONS[0]);
  const [remarks, setRemarks] = useState<string>("");
  const [shippingInsurance, setShippingInsurance] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [invoiceOriginal, setInvoiceOriginal] = useState<string>("―");
  const [salesDestination, setSalesDestination] = useState<string>("");
  const [receiptDate, setReceiptDate] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DELIVERY_METHOD_OPTIONS[0]);
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [shippingDestinationMethod, setShippingDestinationMethod] = useState<string>(DELIVERY_METHOD_OPTIONS[0]);
  const [shippingDestinationArrival, setShippingDestinationArrival] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);

  const COMPANY_INFO = {
    name: "p-kanriclub",
    address: "〒169-0075 東京都新宿区高田馬場4-4-17",
    representative: "代表取締役 田村綾子",
    tel: "TEL 03-5389-1955",
    fax: "FAX 03-5389-1956",
  };

  useEffect(() => {
    const draftId = params?.draftId;
    if (!draftId || Array.isArray(draftId)) return;
    const draft = loadDraftById(draftId);
    const all = loadInventoryRecords();
    const targets = draft ? all.filter((inv) => draft.inventoryIds.includes(inv.id)) : [];
    setIssuedDate(new Date().toISOString().slice(0, 10));
    const machineRows: MachineRow[] = targets.map((inv) => {
      const quantity = Number(inv.quantity ?? 0);
      const unitPrice = Number(inv.unitPrice ?? 0);
      return {
        kind: "machine",
        inventoryId: inv.id,
        maker: inv.maker ?? "",
        machineName: inv.machineName ?? "",
        type: inv.type ?? "",
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
        applicationYusho: "------",
        applicationDate: "",
        note: inv.note ?? inv.notes ?? "",
      };
    });
    setRows(machineRows);
    setSupplierName(targets[0]?.supplier ?? "仕入先");
  }, [params?.draftId]);

  const subtotal = useMemo(() => rows.reduce((sum, item) => sum + (item.amount ?? 0), 0), [rows]);
  const taxRate = 0.1;
  const tax = Math.floor(subtotal * taxRate);
  const shippingInsuranceValue = Number(shippingInsurance || 0);
  const grandTotal = subtotal + tax + shippingInsuranceValue;

  const updateRow = (index: number, updater: (row: Row) => Row) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? updater(row) : row)));
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = Number(value) || 0;
    updateRow(index, (row) => ({
      ...row,
      quantity,
      amount: quantity * row.unitPrice,
    }));
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    const unitPrice = Number(value) || 0;
    updateRow(index, (row) => ({
      ...row,
      unitPrice,
      amount: row.quantity * unitPrice,
    }));
  };

  const handleAmountChange = (index: number, value: string) => {
    const amount = Number(value) || 0;
    updateRow(index, (row) => ({ ...row, amount }));
  };

  const handleMachineChange = (index: number, key: keyof MachineRow, value: string) => {
    updateRow(index, (row) => {
      if (row.kind !== "machine") return row;
      if (key === "applicationYusho" || key === "applicationDate" || key === "note") {
        return { ...row, [key]: value };
      }
      if (key === "machineName" || key === "type" || key === "maker") {
        return { ...row, [key]: value };
      }
      return row;
    });
  };

  const handleFeeChange = (index: number, key: keyof FeeRow, value: string) => {
    updateRow(index, (row) => {
      if (row.kind !== "fee") return row;
      if (key === "feeName" || key === "note") {
        return { ...row, [key]: value };
      }
      return row;
    });
  };

  const handleAddFeeRow = () => {
    setRows((prev) => [
      ...prev,
      {
        kind: "fee",
        id: `${Date.now()}-${prev.length}`,
        feeName: "商品名",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        note: "",
      },
    ]);
  };

  const handleSupplierChange = () => {
    if (typeof window === "undefined") return;
    const next = window.prompt("仕入先を入力してください", supplierName);
    if (next != null) {
      setSupplierName(next);
    }
  };

  const mapRowsToItems = (): PurchaseInvoiceItem[] =>
    rows.map((row) => {
      if (row.kind === "machine") {
        return {
          inventoryId: row.inventoryId,
          maker: row.maker,
          machineName: row.machineName,
          type: row.type,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          amount: row.amount,
          extra: { applicationYusho: row.applicationYusho, applicationDate: row.applicationDate },
          note: row.note,
        };
      }
      return {
        inventoryId: `fee-${row.id}`,
        maker: "",
        machineName: row.feeName,
        type: "",
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        amount: row.amount,
        extra: undefined,
        note: row.note,
      };
    });

  const handleConfirm = () => {
    if (rows.length === 0) {
      alert("対象の在庫が見つかりませんでした");
      return;
    }
    if (typeof window !== "undefined" && !window.confirm("登録してよろしいですか？")) {
      return;
    }
    const invoiceId = generateInvoiceId("vendor");
    const mappedItems = mapRowsToItems();
    const inventoryIds = rows
      .filter((row): row is MachineRow => row.kind === "machine")
      .map((row) => row.inventoryId);
    addPurchaseInvoice({
      invoiceId,
      invoiceType: "vendor",
      createdAt: new Date().toISOString(),
      issuedDate,
      partnerName: supplierName,
      staff,
      inventoryIds: mappedItems.map((item) => item.inventoryId),
      items: mappedItems,
      totalAmount: grandTotal,
      formInput: {
        remarks,
        shippingInsurance: shippingInsurance ?? "",
        paymentDate,
        invoiceOriginal,
        salesDestination,
        receiptDate,
        deliveryMethod,
        arrivalDate,
        shippingDestinationMethod,
        shippingDestinationArrival,
      },
      displayTitle: `${
        (rows[0]?.kind === "machine" ? rows[0]?.machineName : rows[0]?.feeName) ?? "伝票"
      }${rows.length > 1 ? " 他" : ""}`,
    });
    markInventoriesWithInvoice(inventoryIds, invoiceId);
    if (params?.draftId && !Array.isArray(params.draftId)) {
      deleteDraft(params.draftId);
    }
    router.push("/inventory/purchase-invoice/list");
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-neutral-900">
              <span>{supplierName || "仕入先"} 御中</span>
              <button
                type="button"
                onClick={handleSupplierChange}
                className="rounded border border-sky-500 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
              >
                売主検索
              </button>
            </div>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-neutral-700">
              <span className="whitespace-nowrap">日付</span>
              <input
                type="date"
                value={issuedDate}
                onChange={(event) => setIssuedDate(event.target.value)}
                onClick={(event) => triggerDatePicker(event.currentTarget)}
                onFocus={(event) => triggerDatePicker(event.currentTarget)}
                className="w-28 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-[200px] text-xs leading-snug text-neutral-700">
              <p className="line-clamp-2 max-h-[3.2rem] overflow-hidden">
                当社規約に基づき下記の記載購入をいたします。必要事項を入力の上、伝票を登録してください。
              </p>
            </div>
            <div className="w-full rounded bg-orange-100 p-3 text-left text-sm font-semibold leading-snug text-neutral-900 md:w-72">
              <div className="text-base">{COMPANY_INFO.name}</div>
              <div className="text-xs text-neutral-800">{COMPANY_INFO.address}</div>
              <div className="text-xs text-neutral-800">{COMPANY_INFO.representative}</div>
              <div className="text-xs text-neutral-800">{COMPANY_INFO.tel}</div>
              <div className="text-xs text-neutral-800">{COMPANY_INFO.fax}</div>
              <label className="mt-2 flex flex-col gap-1 text-[11px] font-semibold text-neutral-800">
                担当
                <select
                  value={staff}
                  onChange={(event) => setStaff(event.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                >
                  {STAFF_OPTIONS.map((option) => (
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

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">明細</h2>
          <button
            type="button"
            onClick={handleAddFeeRow}
            className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-sky-500"
          >
            行を追加します
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left font-semibold text-slate-700">
              <tr>
                <th className="px-2 py-2">メーカー</th>
                <th className="px-2 py-2">商品名</th>
                <th className="px-2 py-2">タイプ</th>
                <th className="px-2 py-2 text-right">数量</th>
                <th className="px-2 py-2 text-right">単価</th>
                <th className="px-2 py-2 text-right">金額</th>
                <th className="px-2 py-2">申請遊商</th>
                <th className="px-2 py-2">申請日</th>
                <th className="px-2 py-2">商品補足（印刷書類全てに表示されます）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item, index) => (
                <tr key={(item.kind === "machine" ? item.inventoryId : item.id) ?? index} className="hover:bg-slate-50">
                  <td className="px-2 py-2 text-neutral-800">
                    {item.kind === "machine" ? (
                      <span>{item.maker}</span>
                    ) : (
                      <span className="rounded bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700">付帯費用</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-neutral-800">
                    {item.kind === "machine" ? (
                      <span className="font-semibold">{item.machineName}</span>
                    ) : (
                      <select
                        value={item.feeName}
                        onChange={(event) => handleFeeChange(index, "feeName", event.target.value)}
                        className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        {FEE_OPTIONS.map((fee) => (
                          <option key={fee} value={fee}>
                            {fee}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-2 py-2 text-neutral-800">
                    {item.kind === "machine" ? (
                      <span>{item.type}</span>
                    ) : (
                      <span className="text-slate-400">―</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(event) => handleQuantityChange(index, event.target.value)}
                      className="w-20 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-right text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(event) => handleUnitPriceChange(index, event.target.value)}
                      className="w-24 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-right text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2 text-right text-neutral-800">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(event) => handleAmountChange(index, event.target.value)}
                      className="w-28 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-right text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-2">
                    {item.kind === "machine" ? (
                      <select
                        value={item.applicationYusho}
                        onChange={(event) => handleMachineChange(index, "applicationYusho", event.target.value)}
                        className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        {APPLICATION_YUSHO_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-400">―</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {item.kind === "machine" ? (
                      <input
                        type="date"
                        value={item.applicationDate}
                        onClick={(event) => triggerDatePicker(event.currentTarget)}
                        onFocus={(event) => triggerDatePicker(event.currentTarget)}
                        onChange={(event) => handleMachineChange(index, "applicationDate", event.target.value)}
                        className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    ) : (
                      <span className="text-slate-400">―</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {item.kind === "machine" ? (
                      <input
                        value={item.note}
                        onChange={(event) => handleMachineChange(index, "note", event.target.value)}
                        className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    ) : (
                      <input
                        value={item.note}
                        onChange={(event) => handleFeeChange(index, "note", event.target.value)}
                        className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-[11px] shadow-sm focus:border-sky-500 focus:outline-none"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-neutral-800">備考（印刷書類全てに表示されます）</div>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={3}
            className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2 rounded border border-slate-100 bg-slate-50 p-3 text-sm text-neutral-800">
          <div className="flex items-center justify-between font-semibold">
            <span>小計</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>消費税(10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>運送保険(税込)</span>
            <input
              type="number"
              value={shippingInsurance}
              onChange={(event) => setShippingInsurance(event.target.value)}
              className="w-28 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>合計</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3">
        <label className="flex flex-col text-xs font-semibold text-neutral-800">
          支払予定日
          <input
            type="date"
            value={paymentDate}
            onClick={(event) => triggerDatePicker(event.currentTarget)}
            onFocus={(event) => triggerDatePicker(event.currentTarget)}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-neutral-800">
          請求書原本
          <select
            value={invoiceOriginal}
            onChange={(event) => setInvoiceOriginal(event.target.value)}
            className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="―">―</option>
            <option value="要">要</option>
            <option value="不要">不要</option>
          </select>
        </label>
        <label className="flex flex-col text-xs font-semibold text-neutral-800">
          販売先
          <input
            list="sales-destination-list"
            value={salesDestination}
            onChange={(event) => setSalesDestination(event.target.value)}
            className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
          <datalist id="sales-destination-list">
            <option value="デモホール" />
            <option value="サンプル商事" />
            <option value="パーラーABC" />
          </datalist>
        </label>
      </div>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="text-xs font-semibold text-neutral-800">リアルタイムの在庫確認ができます</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-md border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-neutral-800">機械の受取</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="flex flex-col text-xs font-semibold text-neutral-800">
                入庫予定日
                <input
                  type="date"
                  value={receiptDate}
                  onClick={(event) => triggerDatePicker(event.currentTarget)}
                  onFocus={(event) => triggerDatePicker(event.currentTarget)}
                  onChange={(event) => setReceiptDate(event.target.value)}
                  className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-xs font-semibold text-neutral-800">
                配送方法
                <select
                  value={deliveryMethod}
                  onChange={(event) => setDeliveryMethod(event.target.value)}
                  className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                >
                  {DELIVERY_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs font-semibold text-neutral-800">
                到着予定日
                <input
                  type="date"
                  value={arrivalDate}
                  onClick={(event) => triggerDatePicker(event.currentTarget)}
                  onFocus={(event) => triggerDatePicker(event.currentTarget)}
                  onChange={(event) => setArrivalDate(event.target.value)}
                  className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="rounded bg-orange-100 p-3 text-xs font-semibold text-neutral-900">
              <div>{COMPANY_INFO.address}</div>
              <div>{COMPANY_INFO.representative}</div>
              <div>{COMPANY_INFO.tel}</div>
              <div>{COMPANY_INFO.fax}</div>
            </div>
          </div>
          <div className="space-y-3 rounded-md border border-slate-200 p-3">
            <h3 className="text-sm font-semibold text-neutral-800">売契の受取</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex flex-col text-xs font-semibold text-neutral-800">
                配送方法
                <select
                  value={shippingDestinationMethod}
                  onChange={(event) => setShippingDestinationMethod(event.target.value)}
                  className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                >
                  {DELIVERY_METHOD_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs font-semibold text-neutral-800">
                到着予定日
                <input
                  type="date"
                  value={shippingDestinationArrival}
                  onClick={(event) => triggerDatePicker(event.currentTarget)}
                  onFocus={(event) => triggerDatePicker(event.currentTarget)}
                  onChange={(event) => setShippingDestinationArrival(event.target.value)}
                  className="rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="rounded bg-orange-100 p-3 text-xs font-semibold text-neutral-900">
              <div>{COMPANY_INFO.address}</div>
              <div>{COMPANY_INFO.representative}</div>
              <div>{COMPANY_INFO.tel}</div>
              <div>{COMPANY_INFO.fax}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pb-4 pt-1">
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded bg-yellow-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-yellow-200"
        >
          登録
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
