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
  const [shippingInsurance, setShippingInsurance] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState("");
  const [warehousingDate, setWarehousingDate] = useState("");
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);

  const FEE_OPTIONS = ["ダンボール代", "手数料", "送料", "保険料", "その他", "書類代"];

  const triggerDatePicker = (input: HTMLInputElement) => {
    const withPicker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      withPicker.showPicker();
    } else {
      input.focus();
    }
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
      const supplierName = inv.supplierCorporate || inv.supplier || "";
      const storeName = inv.supplierBranch || inv.supplier || "";
      return {
        inventoryId: inv.id,
        maker: inv.maker ?? "",
        machineName: inv.machineName ?? "",
        type: inv.type ?? "",
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
        storeName,
        supplierName,
        supplierPostalCode: inv.supplierPostalCode,
        supplierAddress: inv.supplierAddress,
        supplierPhone: inv.supplierPhone,
        supplierFax: inv.supplierFax,
        remainingDebt: inv.remainingDebt,
        extra: { removalDate: inv.removalDate ?? inv.removeDate ?? "" },
        note: inv.notes ?? inv.note ?? "",
        rowType: "machine",
      };
    });
    const hallName =
      targets[0]?.supplierBranch || targets[0]?.supplier || targets[0]?.supplierCorporate || "";
    if (hallName) {
      setPartner(hallName);
    }
    setItems(normalizedItems);
  }, [params?.draftId]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.amount ?? 0), 0), [items]);
  const taxRate = 0.1;
  const tax = Math.floor(subtotal * taxRate);
  const grandTotal = subtotal + tax + Number(shippingInsurance || 0);

  const supplierCard = useMemo(
    () => {
      const first = items.find((item) => item.rowType !== "fee");
      return {
        name: first?.supplierName || partner || "仕入先未登録",
        postalCode: first?.supplierPostalCode || "",
        address: first?.supplierAddress || "",
        phone: first?.supplierPhone || "",
        fax: first?.supplierFax || "",
      };
    },
    [items, partner],
  );

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
        if (key === "machineName" && item.rowType === "fee") {
          return { ...item, machineName: String(value) };
        }
        if (key === "note") {
          return { ...item, note: String(value) };
        }
        return item;
      }),
    );
  };

  const handleExtraChange = (index: number, extraKey: string, value: string) => {
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
        inventoryId: `fee-${Date.now()}-${prev.length}`,
        machineName: FEE_OPTIONS[0],
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        rowType: "fee",
        note: "",
      },
    ]);
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      alert("対象の在庫が見つかりませんでした");
      return;
    }
    const invoiceId = generateInvoiceId("hall");
    const inventoryIds = items.filter((item) => item.rowType !== "fee").map((item) => item.inventoryId);
    addPurchaseInvoice({
      invoiceId,
      invoiceType: "hall",
      createdAt: new Date().toISOString(),
      issuedDate,
      partnerName: partner,
      staff,
      inventoryIds,
      items,
      totalAmount: grandTotal,
      formInput: {
        remarks,
        shippingInsurance: shippingInsurance ?? "",
        paymentDate,
        warehousingDate,
      },
      displayTitle: `${items[0]?.machineName ?? "伝票"}${items.length > 1 ? " 他" : ""}`,
    });
    markInventoriesWithInvoice(inventoryIds, invoiceId);
    if (params?.draftId && !Array.isArray(params.draftId)) {
      deleteDraft(params.draftId);
    }
    router.push("/inventory/purchase-invoice/list");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[280px] space-y-3 text-sm text-neutral-800">
            <h1 className="text-lg font-semibold text-neutral-900">
              p-kanriclub と {partner || "○○ホール"} は下記の条件で売買契約を締結いたします
            </h1>
            <div className="grid gap-2 md:grid-cols-3">
              <label className="flex flex-col text-xs font-semibold text-neutral-800 whitespace-nowrap">
                日付
                <input
                  type="date"
                  value={issuedDate}
                  onClick={(event) => triggerDatePicker(event.currentTarget)}
                  onFocus={(event) => triggerDatePicker(event.currentTarget)}
                  onChange={(event) => setIssuedDate(event.target.value)}
                  className="h-9 rounded border border-slate-300 bg-yellow-100 px-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-xs font-semibold text-neutral-800 whitespace-nowrap">
                ホール名
                <input
                  value={partner}
                  onChange={(event) => setPartner(event.target.value)}
                  className="h-9 rounded border border-slate-300 bg-yellow-100 px-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-xs font-semibold text-neutral-800 whitespace-nowrap">
                担当
                <input
                  value={staff}
                  onChange={(event) => setStaff(event.target.value)}
                  className="h-9 rounded border border-slate-300 bg-yellow-100 px-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-1 rounded border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-neutral-900">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
              <span>仕入先</span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] text-neutral-700">ホール</span>
            </div>
            <div className="text-base text-neutral-900">{supplierCard.name}</div>
            <div className="whitespace-nowrap text-xs text-neutral-700">〒{supplierCard.postalCode || "-"}</div>
            <div className="whitespace-nowrap text-xs text-neutral-700">{supplierCard.address || "住所未登録"}</div>
            {(supplierCard.phone || supplierCard.fax) && (
              <div className="flex gap-2 whitespace-nowrap text-[11px] text-neutral-700">
                {supplierCard.phone && <span>TEL {supplierCard.phone}</span>}
                {supplierCard.fax && <span>FAX {supplierCard.fax}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid items-start gap-3 md:grid-cols-3">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-neutral-800">
            <div>合計金額</div>
            <div className="text-lg">{formatCurrency(grandTotal)}</div>
          </div>
          <label className="flex flex-col text-sm font-semibold text-neutral-800 whitespace-nowrap">
            支払日
            <input
              type="date"
              value={paymentDate}
              onClick={(event) => triggerDatePicker(event.currentTarget)}
              onFocus={(event) => triggerDatePicker(event.currentTarget)}
              onChange={(event) => setPaymentDate(event.target.value)}
              className="h-9 w-40 rounded border border-slate-300 bg-yellow-100 px-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col text-sm font-semibold text-neutral-800 whitespace-nowrap">
            入庫日
            <input
              type="date"
              value={warehousingDate}
              onClick={(event) => triggerDatePicker(event.currentTarget)}
              onFocus={(event) => triggerDatePicker(event.currentTarget)}
              onChange={(event) => setWarehousingDate(event.target.value)}
              className="h-9 w-40 rounded border border-slate-300 bg-yellow-100 px-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
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
            費用行を追加
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border border-slate-300 text-xs text-neutral-900">
            <thead className="bg-slate-50 font-semibold text-neutral-800">
              <tr className="whitespace-nowrap">
                <th className="border border-slate-300 px-2 py-2">撤去日</th>
                <th className="border border-slate-300 px-2 py-2">店舗名</th>
                <th className="border border-slate-300 px-2 py-2">メーカー名</th>
                <th className="border border-slate-300 px-2 py-2">機種名 / 費目</th>
                <th className="border border-slate-300 px-2 py-2">タイプ</th>
                <th className="border border-slate-300 px-2 py-2 text-right">残債</th>
                <th className="border border-slate-300 px-2 py-2 text-right">数量</th>
                <th className="border border-slate-300 px-2 py-2 text-right">単価</th>
                <th className="border border-slate-300 px-2 py-2 text-right">金額</th>
                <th className="border border-slate-300 px-2 py-2">商品補足</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.inventoryId}-${index}`} className="whitespace-nowrap odd:bg-white even:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-1">
                    <input
                      type="date"
                      value={(item.extra as { removalDate?: string })?.removalDate ?? ""}
                      onClick={(event) => triggerDatePicker(event.currentTarget)}
                      onFocus={(event) => triggerDatePicker(event.currentTarget)}
                      onChange={(event) => handleExtraChange(index, "removalDate", event.target.value)}
                      className="h-8 w-28 rounded border border-slate-300 bg-yellow-100 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <input
                      value={item.storeName ?? (item.extra as { storeName?: string })?.storeName ?? ""}
                      readOnly
                      className="h-8 w-40 rounded border border-slate-200 bg-slate-100 px-2 text-xs text-neutral-800 shadow-inner"
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-sm text-neutral-800">{item.maker}</td>
                  <td className="border border-slate-300 px-2 py-1">
                    {item.rowType === "fee" ? (
                      <select
                        value={item.machineName}
                        onChange={(event) => handleItemChange(index, "machineName", event.target.value)}
                        className="h-8 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                      >
                        {FEE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-1 text-sm font-semibold text-neutral-900">{item.machineName}</div>
                    )}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-sm text-neutral-800">{item.type}</td>
                  <td className="border border-slate-300 px-2 py-1 text-right text-sm text-neutral-900">
                    {item.remainingDebt != null ? item.remainingDebt.toLocaleString() : "―"}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(event) => handleItemChange(index, "quantity", Number(event.target.value))}
                      className="h-8 w-16 rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(event) => handleItemChange(index, "unitPrice", Number(event.target.value))}
                      className="h-8 w-20 rounded border border-slate-300 bg-yellow-100 px-2 text-right text-xs shadow-sm focus:border-sky-500 focus:outline-none"
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-right text-sm font-semibold text-neutral-900">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <input
                      value={item.note ?? ""}
                      onChange={(event) => handleItemChange(index, "note", event.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-yellow-100 px-2 text-xs shadow-sm focus:border-sky-500 focus:outline-none"
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
              onChange={(event) => setShippingInsurance(event.target.value)}
              className="w-28 rounded border border-slate-300 bg-yellow-100 px-2 py-1 text-sm shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <span>合計金額</span>
            <span>{formatCurrency(grandTotal)}</span>
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
