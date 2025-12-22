"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PurchaseInvoiceLegacyForm } from "../../_components/PurchaseInvoiceLegacyForm";
import { PurchaseInvoiceDetailView } from "../../_components/PurchaseInvoiceDetailView";
import { loadDraftById, loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";
import { loadPurchaseInvoices } from "@/lib/demo-data/purchaseInvoices";
import type { PurchaseInvoice } from "@/types/purchaseInvoices";

export default function HallInvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = Array.isArray(params?.invoiceId) ? params?.invoiceId[0] : params?.invoiceId;
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [inventories, setInventories] = useState<InventoryRecord[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    const existingInvoices = loadPurchaseInvoices();
    const found = existingInvoices.find((entry) => entry.invoiceId === invoiceId) ?? null;
    if (found) {
      setInvoice(found);
      setChecked(true);
      return;
    }

    const draft = loadDraftById(invoiceId);
    if (draft) {
      const allInventory = loadInventoryRecords();
      const related = allInventory.filter((item) => draft.inventoryIds.includes(item.id));
      setInventories(related);
    }
    setChecked(true);
  }, [invoiceId]);

  if (!invoiceId) {
    return null;
  }

  if (invoice) {
    return (
      <PurchaseInvoiceDetailView
        invoiceId={invoiceId}
        title="購入伝票発行（ホール）"
        expectedType="hall"
      />
    );
  }

  if (checked && inventories) {
    return <PurchaseInvoiceLegacyForm type="hall" draftId={invoiceId} inventories={inventories} />;
  }

  if (checked) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10 text-center text-sm text-neutral-700">
        対象の購入伝票が見つかりませんでした。
      </div>
    );
  }

  return null;
}
