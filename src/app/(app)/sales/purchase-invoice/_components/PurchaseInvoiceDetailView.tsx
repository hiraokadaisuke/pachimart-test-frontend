"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatCurrency, loadInventoryRecords } from "@/lib/demo-data/demoInventory";
import { BUYER_OPTIONS, findBuyerById } from "@/lib/demo-data/buyers";
import { loadMasterData } from "@/lib/demo-data/demoMasterData";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import { loadSerialDraft, loadSerialInput } from "@/lib/serialInputStorage";
import type { InventoryRecord } from "@/lib/demo-data/demoInventory";
import type { PurchaseInvoice } from "@/types/purchaseInvoices";
import { PrintMenu } from "@/app/(app)/sales/_components/PrintMenu";

type Props = {
  invoiceId: string;
  title: string;
  expectedType?: PurchaseInvoice["invoiceType"];
};

const COMPANY_INFO = {
  name: "p-kanriclub",
  address: "〒169-0075 東京都新宿区高田馬場4-4-17",
  representative: "代表取締役 田村綾子",
  tel: "TEL 03-5389-1955",
  fax: "FAX 03-5389-1956",
};

const DOCUMENT_ACTIONS = [
  { label: "売買契約書", path: "sales-contract", requiresSerial: false },
  { label: "支払依頼書", path: "payment-request", requiresSerial: false },
  { label: "入庫検品依頼書", path: "inspection-pickup", requiresSerial: true },
  { label: "書類一括", path: null, requiresSerial: false },
] as const;

const CONTRACT_COPY_OPTIONS = [
  { value: "both", label: "両方確認" },
  { value: "seller", label: "売主控え確認" },
  { value: "buyer", label: "買主控え確認" },
] as const;

type ContractCopyOption = (typeof CONTRACT_COPY_OPTIONS)[number]["value"];

const formatFullDate = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}年${month}月${day}日`;
};

const formatNumber = (value?: number): string => {
  if (value == null || Number.isNaN(value)) return "―";
  return value.toLocaleString("ja-JP");
};

export function PurchaseInvoiceDetailView({ invoiceId, title, expectedType }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [inventories, setInventories] = useState<Map<string, InventoryRecord>>(new Map());
  const [attemptedLoad, setAttemptedLoad] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedPrintLabel, setSelectedPrintLabel] = useState<string | null>(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(BUYER_OPTIONS[0].id);
  const [selectedContractCopy, setSelectedContractCopy] = useState<ContractCopyOption>("both");
  const masterData = useMemo(() => loadMasterData(), []);

  useEffect(() => {
    const invoices = loadPurchaseInvoices();
    const target = invoices.find((entry) => entry.invoiceId === invoiceId);
    setInvoice(target ?? null);
    setAttemptedLoad(true);
  }, [invoiceId]);

  useEffect(() => {
    const records = loadInventoryRecords();
    setInventories(new Map(records.map((record) => [record.id, record])));
  }, []);

  useEffect(() => {
    setIsPrintModalOpen(false);
    setSelectedPrintLabel(null);
    setSelectedBuyerId(BUYER_OPTIONS[0].id);
    setSelectedContractCopy("both");
  }, [invoiceId]);

  const items = useMemo(() => invoice?.items ?? [], [invoice]);

  const primaryInventory = useMemo(() => {
    if (!invoice) return null;
    return invoice.inventoryIds.map((id) => inventories.get(id)).find((entry) => Boolean(entry)) ?? null;
  }, [invoice, inventories]);

  const supplierName = useMemo(() => {
    const fromItem = items[0]?.supplierName || items[0]?.storeName;
    const fromInvoice = invoice?.partnerName;
    const fromInventory =
      primaryInventory?.supplierCorporate || primaryInventory?.supplierBranch || primaryInventory?.supplier;
    return (fromItem || fromInvoice || fromInventory || "◯◯◯◯").trim();
  }, [invoice?.partnerName, items, primaryInventory]);

  const supplierInvoiceNumber = useMemo(() => {
    const supplier = masterData.suppliers.find((entry) => entry.corporateName === supplierName);
    return supplier?.invoiceNumber || "―";
  }, [masterData.suppliers, supplierName]);

  const buyerInvoiceNumber = masterData.companyProfile.invoiceNumber || "―";

  const branchName = useMemo(() => {
    const fromItem = items[0]?.storeName;
    const fromInventory = primaryInventory?.supplierBranch;
    return (fromItem || fromInventory || "").trim();
  }, [items, primaryInventory]);

  const staffName = invoice?.staff || "デモユーザー";
  const remarks = invoice?.formInput?.remarks || "";
  const shippingInsurance = Number(invoice?.formInput?.shippingInsurance || 0);
  const extraCosts = useMemo(() => invoice?.extraCosts ?? [], [invoice?.extraCosts]);
  const extraCostTotal = useMemo(
    () => extraCosts.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [extraCosts],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const amount = item.amount ?? (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
        return sum + (Number.isNaN(amount) ? 0 : amount);
      }, 0),
    [items],
  );

  const itemTotal = subtotal;
  const subTotalWithExtras = itemTotal + extraCostTotal;
  const tax = invoice?.invoiceType === "hall" ? Math.floor(itemTotal * 0.1) : 0;
  const computedGrandTotal =
    invoice?.invoiceType === "hall"
      ? itemTotal + tax + shippingInsurance + extraCostTotal
      : subTotalWithExtras + shippingInsurance;
  const grandTotal =
    invoice?.totalAmount && invoice.totalAmount >= computedGrandTotal
      ? invoice.totalAmount
      : computedGrandTotal;

  const headerContractPartner = branchName ? `${supplierName} ${branchName}` : supplierName;
  const recipientLine = branchName ? `${supplierName} ${branchName} 御中` : `${supplierName} 御中`;

  const issuedDateLabel = formatFullDate(invoice?.issuedDate || invoice?.createdAt);

  const serialInputTarget = invoice?.inventoryIds?.[0];

  const handleSerialInput = () => {
    if (serialInputTarget) {
      router.push(`/sales/purchase-invoice/serial-input/${serialInputTarget}`);
    } else {
      alert("紐づく在庫がありません");
    }
  };

  const handlePrintMenu = (label: string) => {
    if (label === "書類一括") {
      alert("書類一括の印刷は準備中です");
      return;
    }
    setSelectedPrintLabel(label);
    if (label === "売買契約書") {
      setSelectedContractCopy("both");
    }
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    if (!invoice || !selectedPrintLabel) return;
    const buyer = findBuyerById(selectedBuyerId);
    const target = DOCUMENT_ACTIONS.find((action) => action.label === selectedPrintLabel);
    if (!target?.path) return;
    const path = target.path;
    const params = new URLSearchParams({ buyerId: buyer.id });
    if (path === "sales-contract") {
      params.set("copy", selectedContractCopy);
    }
    const url = `/sales/purchase-invoice/print/${path}/${invoice.invoiceId}?${params.toString()}`;
    router.push(url);
    setIsPrintModalOpen(false);
  };

  const handleEdit = () => {
    if (!invoice) return;
    router.push(`/sales/purchase-invoice/${invoice.invoiceType}/${invoice.invoiceId}/reorder`);
  };

  const handleDelete = () => {
    alert("削除機能はデモでは無効です");
  };

  if (!invoice && attemptedLoad) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded border border-slate-300 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-neutral-800">対象の購入伝票が見つかりませんでした。</div>
          <div className="mt-3 text-sm text-neutral-600">一覧に戻って別の伝票を選択してください。</div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-300"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const serialComplete = invoice.inventoryIds.every((id) => {
    const inventory = inventories.get(id);
    const targetQuantity = Number(inventory?.quantity ?? 1) || 1;
    const stored = loadSerialInput(id) ?? loadSerialDraft(id);
    const rows = stored?.rows ?? [];
    if (rows.length < targetQuantity) return false;
    return rows.slice(0, targetQuantity).every((row) => row.main?.trim());
  });

  if (expectedType && invoice.invoiceType !== expectedType) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded border border-amber-300 bg-amber-50 p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-amber-800">別種別の購入伝票が選択されました。</div>
          <div className="mt-3 text-sm text-amber-700">正しい種別の伝票を一覧から選択してください。</div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-slate-300"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={() => router.push(`/sales/purchase-invoice/list`)}
              className="rounded border border-emerald-500 bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
            >
              一覧へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-[13px] text-neutral-800">
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] border border-neutral-500 bg-white px-6 py-5 text-neutral-900 shadow-md">
            <div className="mb-4 text-base font-semibold">・買主入力</div>
            <div className="space-y-2 text-sm">
              <label className="block text-xs text-neutral-700">自社選択</label>
              <select
                value={selectedBuyerId}
                onChange={(event) => setSelectedBuyerId(event.target.value)}
                className="w-full border border-neutral-500 bg-white px-2 py-2 text-sm"
              >
                {BUYER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedPrintLabel === "売買契約書" && (
              <div className="mt-4 space-y-2 text-sm">
                <label className="block text-xs text-neutral-700">控え種別</label>
                <div className="space-y-2">
                  {CONTRACT_COPY_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="contract-copy"
                        value={option.value}
                        checked={selectedContractCopy === option.value}
                        onChange={() => setSelectedContractCopy(option.value)}
                        className="h-4 w-4"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="border border-neutral-500 bg-slate-200 px-5 py-2 text-neutral-800"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="border border-yellow-600 bg-yellow-300 px-5 py-2 text-neutral-900"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-4">
        <div className="border-b border-slate-400 pb-2">
          <div className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
            <span className="text-emerald-700">●</span>
            <span>{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded border border-slate-300 bg-slate-200 px-3 py-2 text-sm font-semibold text-neutral-800">
          <span className="h-5 w-1.5 rounded bg-emerald-700" aria-hidden />
          <span>詳細情報</span>
        </div>

        <PrintMenu
          menuLabel="メニュー："
          actions={DOCUMENT_ACTIONS.map((action) => ({
            label: action.label,
            onClick: () => handlePrintMenu(action.label),
            disabled: action.requiresSerial && !serialComplete,
          }))}
          sideLabel="機械番号明細："
          sideAction={{ label: "購入機械番号入力", onClick: handleSerialInput }}
        />
        {!serialComplete && (
          <div className="text-[11px] font-medium text-amber-700">
            番号が揃っていないため印刷できません。
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-full max-w-5xl border border-black bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap justify-between gap-4">
              <div className="min-w-[260px] flex-1 space-y-1">
                <div className="text-lg font-semibold text-neutral-900">{recipientLine}</div>
                <div className="text-sm text-neutral-800">
                  ＊p-kanriclub と {headerContractPartner} は下記の条件で売買契約を締結いたします
                </div>
                <div className="text-xs text-neutral-700">インボイス番号 {supplierInvoiceNumber}</div>
              </div>
              <div className="flex flex-col items-end gap-1 text-sm font-semibold text-neutral-900">
                <div>{issuedDateLabel}</div>
                <div className="flex gap-4 rounded border border-black px-3 py-2 text-xs font-semibold">
                  <div className="space-y-0.5 text-left">
                    <div className="font-bold">[買主]</div>
                    <div>{COMPANY_INFO.address}</div>
                    <div>{COMPANY_INFO.name}</div>
                    <div>{COMPANY_INFO.representative}</div>
                    <div className="flex flex-col">
                      <span>{COMPANY_INFO.tel}</span>
                      <span>{COMPANY_INFO.fax}</span>
                    </div>
                    <div>インボイス番号 {buyerInvoiceNumber}</div>
                  </div>
                </div>
                <div className="text-xs text-neutral-800">担当　{staffName}</div>
              </div>
            </div>

            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full table-fixed border border-black text-[12px]">
                <thead className="bg-slate-100 text-center font-semibold">
                  <tr>
                    <th className="border border-black px-2 py-2">撤去日</th>
                    <th className="border border-black px-2 py-2">店舗名</th>
                    <th className="border border-black px-2 py-2">メーカー名</th>
                    <th className="border border-black px-2 py-2">商品名</th>
                    <th className="border border-black px-2 py-2">タイプ</th>
                    <th className="border border-black px-2 py-2 text-right">数量</th>
                    <th className="border border-black px-2 py-2 text-right">単価</th>
                    <th className="border border-black px-2 py-2 text-right">金額</th>
                    <th className="border border-black px-2 py-2 text-right">残債</th>
                    <th className="border border-black px-2 py-2">商品補足</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-black px-3 py-6 text-center text-sm text-neutral-600">
                        明細が登録されていません。
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const removalDate = formatFullDate((item.extra as { removalDate?: string } | undefined)?.removalDate);
                      const store = item.storeName || (item.extra as { storeName?: string } | undefined)?.storeName || "―";
                      return (
                        <tr key={item.itemId ?? `${item.inventoryId}-${index}`} className="align-middle text-center">
                          <td className="border border-black px-2 py-2">{removalDate}</td>
                          <td className="border border-black px-2 py-2 text-left">{store}</td>
                          <td className="border border-black px-2 py-2 text-left">{item.maker || ""}</td>
                          <td className="border border-black px-2 py-2 text-left font-semibold">{item.machineName}</td>
                          <td className="border border-black px-2 py-2 text-left">{item.type || ""}</td>
                          <td className="border border-black px-2 py-2 text-right">{formatNumber(item.quantity)}</td>
                          <td className="border border-black px-2 py-2 text-right">{formatNumber(item.unitPrice)}</td>
                          <td className="border border-black px-2 py-2 text-right font-semibold">{formatNumber(item.amount)}</td>
                          <td className="border border-black px-2 py-2 text-right">{formatNumber(item.remainingDebt)}</td>
                          <td className="border border-black px-2 py-2 text-left">{item.note || ""}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="text-sm font-semibold">
                  {invoice.invoiceType === "hall" ? (
                    <>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">小計</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">{formatCurrency(itemTotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">消費税（10%）</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">{formatCurrency(tax)}</td>
                      </tr>
                      {extraCosts.length > 0 && (
                        <tr>
                          <td colSpan={7} className="border border-black px-3 py-2 text-right">別費用合計</td>
                          <td colSpan={3} className="border border-black px-3 py-2 text-right">{formatCurrency(extraCostTotal)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">運送保険（税込）</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">
                          {formatCurrency(shippingInsurance)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">合計金額</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">{formatCurrency(grandTotal)}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">商品代金</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">{formatCurrency(itemTotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">別途費用</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">
                          {formatCurrency(extraCostTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">小計</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">
                          {formatCurrency(subTotalWithExtras)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">運送費</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">
                          {formatCurrency(shippingInsurance)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="border border-black px-3 py-2 text-right">合計</td>
                        <td colSpan={3} className="border border-black px-3 py-2 text-right">{formatCurrency(grandTotal)}</td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
            </div>

            <div className="mb-4 min-h-[120px] border border-black p-3 text-[13px]">
              <div className="mb-2 text-sm font-semibold text-neutral-900">備考</div>
              <div className="whitespace-pre-wrap text-neutral-800">{remarks || "―"}</div>
            </div>

            {extraCosts.length > 0 && (
              <div className="mb-4 border border-black p-3 text-[12px]">
                <div className="mb-2 text-sm font-semibold text-neutral-900">別費用明細</div>
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-slate-100 text-left font-semibold">
                    <tr>
                      <th className="border border-black px-2 py-1">項目</th>
                      <th className="border border-black px-2 py-1 text-right">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraCosts.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-black px-2 py-1">{item.label}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pb-6">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded border border-amber-500 bg-amber-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-amber-200"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-amber-500 bg-amber-300 px-6 py-2 text-sm font-bold text-neutral-900 shadow hover:bg-amber-200"
          >
            削除
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-slate-400 bg-slate-200 px-6 py-2 text-sm font-semibold text-neutral-900 shadow hover:bg-slate-300"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseInvoiceDetailView;
