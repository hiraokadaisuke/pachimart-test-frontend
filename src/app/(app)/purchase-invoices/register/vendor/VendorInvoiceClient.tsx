"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { loadSimpleInventory } from "@/lib/demo-data/inventory";
import { addPurchaseInvoice, generateInvoiceId } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoiceItem, SimpleInventory } from "@/types/purchaseInvoices";
import VendorInvoiceDetailSection from "./VendorInvoiceDetailSection";
import { createDefaultDraftRow } from "./vendorInvoiceConstants";
import type { DraftRow, FormState, InvoiceRow } from "./vendorInvoiceTypes";

const defaultForm: FormState = {
  issuedDate: "",
  staff: "",
  supplierName: "",
  supplierAddress: "",
  tel: "",
  fax: "",
  invoiceNumber: "",
  paymentDate: "",
  arrivalDate: "",
  memo: "",
  salesDestination: "",
  invoiceOriginal: "--",
  shippingInsurance: "",
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
  const [draftRow, setDraftRow] = useState<DraftRow>(createDefaultDraftRow());

  useEffect(() => {
    const loaded = loadSimpleInventory();
    const selected = loaded.filter((item) => ids.includes(item.id));
    const defaultDraftRow = createDefaultDraftRow();
    setInventory(selected);
    setRows(
      selected.map((item) => ({
        id: item.id,
        inventoryId: item.id,
        maker: item.maker,
        machineName: item.machineName,
        type: item.type,
        productName: defaultDraftRow.productName,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        remainingDebt: defaultDraftRow.remainingDebt,
        applicationRoute: defaultDraftRow.applicationRoute,
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
    setDraftRow(createDefaultDraftRow());
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
          <label className="space-y-1 text-sm text-neutral-800">
            <span className="font-semibold">インボイス番号</span>
            <input
              value={form.invoiceNumber}
              onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>

        {/* ===== Seller/Buyer Block (DO NOT TOUCH) END ===== */}
        {/* ===== Detail Section (below seller/buyer) START ===== */}
        <VendorInvoiceDetailSection
          form={form}
          rows={rows}
          draftRow={draftRow}
          subtotal={subtotal}
          tax={tax}
          totalAmount={totalAmount}
          onFormChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
          onDraftChange={handleDraftChange}
          onAddRow={handleAddRow}
          onRowChange={handleRowChange}
          onRemoveRow={handleRemoveRow}
        />
        {/* ===== Detail Section (below seller/buyer) END ===== */}
      </form>
    </div>
  );
}
