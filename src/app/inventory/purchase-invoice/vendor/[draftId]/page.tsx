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

export default function VendorInvoicePage() {
  const params = useParams<{ draftId: string }>();
  const router = useRouter();
  const [issuedDate, setIssuedDate] = useState<string>("");
  const [partner, setPartner] = useState("");
  const [staff, setStaff] = useState("");
  const [remarks, setRemarks] = useState("");
  const [address, setAddress] = useState("");
  const [shippingInsurance, setShippingInsurance] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [invoiceCategory, setInvoiceCategory] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("配送");
  const [arrivalDate, setArrivalDate] = useState("");
  const [shippingDestinationMethod, setShippingDestinationMethod] = useState("配送");
  const [shippingDestinationArrival, setShippingDestinationArrival] = useState("");
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);

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
    const normalizedItems: PurchaseInvoiceItem[] = targets.map((inv) => {
      const quantity = inv.quantity ?? 0;
      const unitPrice = inv.unitPrice ?? 0;
      return {
        inventoryId: inv.id,
        maker: inv.maker ?? "",
        machineName: inv.machineName ?? "",
        type: inv.type ?? "",
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
        extra: inv.remainingDebt != null ? { remainingDebt: inv.remainingDebt } : undefined,
        note: inv.note ?? inv.notes ?? "",
      };
    });
    setItems(normalizedItems);
  }, [params?.draftId]);

  const machineNameOptions = useMemo(() => {
    const all = loadInventoryRecords();
    return Array.from(new Set(all.map((inv) => inv.machineName ?? "").filter(Boolean)));
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.amount ?? 0), 0), [items]);
  const taxRate = 0.1;
  const tax = Math.floor(subtotal * taxRate);
  const grandTotal = subtotal + tax + shippingInsurance;

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

  const handleExtraChange = (
    index: number,
    extraKey: string,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, extra: { ...(item.extra ?? {}), [extraKey]: value } } : item,
      ),
    );
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        inventoryId: `new-${Date.now()}-${prev.length}`,
        maker: "",
        machineName: "",
        type: "",
        quantity: 0,
        unitPrice: 0,
        amount: 0,
        extra: {},
        note: "",
      },
    ]);
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      alert("対象の在庫が見つかりませんでした");
      return;
    }
    const invoiceId = generateInvoiceId("vendor");
    addPurchaseInvoice({
      invoiceId,
      invoiceType: "vendor",
      createdAt: new Date().toISOString(),
      issuedDate,
      partnerName: partner,
      staff,
      inventoryIds: items.map((item) => item.inventoryId),
      items,
      totalAmount: grandTotal,
      formInput: {
        remarks,
        address,
        shippingInsurance,
        paymentDate,
        invoiceCategory,
        receiptDate,
        deliveryMethod,
        arrivalDate,
        shippingDestinationMethod,
        shippingDestinationArrival,
      },
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
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
              <span>買主情報（{partner || "買主名"} 御中）</span>
              <span className="rounded bg-orange-100 px-3 py-1 text-sm font-bold text-neutral-800">売主控用</span>
            </div>
            <div className="text-sm text-neutral-700">当社規約に基づき下記の記載購入をいたします。</div>
            <div className="text-xs text-red-600">
              ※紛失盗難機器のキャンセルは売買代金の50％を徴収していただきます。
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm text-neutral-800">
            <label className="flex flex-col text-right">
              <span className="text-xs font-semibold text-neutral-700">日付</span>
              <input
                type="date"
                value={issuedDate}
                onChange={(event) => setIssuedDate(event.target.value)}
                className="w-36 rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
            <div className="w-64 rounded bg-orange-100 p-3 text-left text-sm font-semibold text-neutral-900">
              <div>{COMPANY_INFO.name}</div>
              <div>{COMPANY_INFO.address}</div>
              <div>{COMPANY_INFO.representative}</div>
              <div>{COMPANY_INFO.tel}</div>
              <div>{COMPANY_INFO.fax}</div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col text-sm font-semibold text-neutral-800">
            業者名
            <input
              value={partner}
              onChange={(event) => setPartner(event.target.value)}
              className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-sm font-semibold text-neutral-800">
            担当
            <input
              value={staff}
              onChange={(event) => setStaff(event.target.value)}
              className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-sm font-semibold text-neutral-800">
            住所等
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">明細</h2>
          <button
            type="button"
            onClick={handleAddRow}
            className="rounded bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-sky-500"
          >
            行を追加します
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-3">メーカー名</th>
                <th className="px-3 py-3">商品名</th>
                <th className="px-3 py-3">タイプ</th>
                <th className="px-3 py-3 text-right">数量</th>
                <th className="px-3 py-3 text-right">単価</th>
                <th className="px-3 py-3 text-right">金額</th>
                <th className="px-3 py-3 text-right">残債</th>
                <th className="px-3 py-3">申請連絡</th>
                <th className="px-3 py-3">申請日</th>
                <th className="px-3 py-3">商品補足</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={`${item.inventoryId}-${index}`} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-neutral-800">{item.maker}</td>
                  <td className="px-3 py-3 text-neutral-800">
                    <div className="flex flex-col gap-1">
                      <span>{item.machineName}</span>
                      <select
                        value={item.machineName}
                        onChange={(event) => handleItemChange(index, "machineName", event.target.value)}
                        className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {machineNameOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">{item.type}</td>
                  <td className="px-3 py-3 text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, "quantity", Number(event.target.value))}
                      className="w-20 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(event) => handleItemChange(index, "unitPrice", Number(event.target.value))}
                      className="w-28 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3 text-right text-neutral-800">{formatCurrency(item.amount)}</td>
                  <td className="px-3 py-3 text-right text-neutral-800">
                    {item.extra?.remainingDebt != null ? formatCurrency(item.extra.remainingDebt as number) : "無"}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      value={(item.extra as { applicationContact?: string })?.applicationContact ?? ""}
                      onChange={(event) => handleExtraChange(index, "applicationContact", event.target.value)}
                      className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="date"
                      value={(item.extra as { applicationDate?: string })?.applicationDate ?? ""}
                      onChange={(event) => handleExtraChange(index, "applicationDate", event.target.value)}
                      className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      value={item.note ?? ""}
                      onChange={(event) => handleItemChange(index, "note", event.target.value)}
                      className="w-full rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-neutral-800">備考</div>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={5}
            className="w-full rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-neutral-800">
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
              onChange={(event) => setShippingInsurance(Number(event.target.value))}
              className="w-28 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>合計金額</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="flex flex-col text-sm font-semibold text-neutral-800">
          支払日
          <input
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col text-sm font-semibold text-neutral-800">
          請求書本体（仮）
          <select
            value={invoiceCategory}
            onChange={(event) => setInvoiceCategory(event.target.value)}
            className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="">未設定</option>
            <option value="請求済">請求済</option>
            <option value="支払済">支払済</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-800">商品受取方法</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <label className="flex flex-col text-sm font-semibold text-neutral-800">
              入庫予定日
              <input
                type="date"
                value={receiptDate}
                onChange={(event) => setReceiptDate(event.target.value)}
                className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col text-sm font-semibold text-neutral-800">
              配送方法
              <select
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value)}
                className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="配送">配送</option>
                <option value="持込">持込</option>
              </select>
            </label>
            <label className="flex flex-col text-sm font-semibold text-neutral-800">
              到着予定日
              <input
                type="date"
                value={arrivalDate}
                onChange={(event) => setArrivalDate(event.target.value)}
                className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="rounded bg-orange-100 p-3 text-sm font-semibold text-neutral-900">
            <div>{COMPANY_INFO.address}</div>
            <div>{COMPANY_INFO.representative}</div>
            <div>{COMPANY_INFO.tel}</div>
            <div>{COMPANY_INFO.fax}</div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-800">商品送先</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex flex-col text-sm font-semibold text-neutral-800">
              配送方法
              <select
                value={shippingDestinationMethod}
                onChange={(event) => setShippingDestinationMethod(event.target.value)}
                className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="配送">配送</option>
                <option value="持込">持込</option>
              </select>
            </label>
            <label className="flex flex-col text-sm font-semibold text-neutral-800">
              到着予定日
              <input
                type="date"
                value={shippingDestinationArrival}
                onChange={(event) => setShippingDestinationArrival(event.target.value)}
                className="rounded border border-slate-300 bg-yellow-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="rounded bg-orange-100 p-3 text-sm font-semibold text-neutral-900">
            <div>{COMPANY_INFO.address}</div>
            <div>{COMPANY_INFO.representative}</div>
            <div>{COMPANY_INFO.tel}</div>
            <div>{COMPANY_INFO.fax}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("よろしいですか？")) {
              handleConfirm();
            }
          }}
          className="rounded bg-yellow-300 px-6 py-3 text-sm font-bold text-neutral-900 shadow hover:bg-yellow-200"
        >
          登録
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-50"
        >
          戻る
        </button>
      </div>
    </div>
  );
}
