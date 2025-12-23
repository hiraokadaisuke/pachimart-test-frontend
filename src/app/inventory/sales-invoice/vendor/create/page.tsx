"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { SalesInvoiceLegacyVendorForm } from "../_components/SalesInvoiceLegacyVendorForm";
import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";

function VendorSalesInvoiceCreateContent() {
  const searchParams = useSearchParams();
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);

  const requestedIds = useMemo(() => {
    const raw = searchParams?.get("ids");
    if (!raw) return [] as string[];
    return raw.split(",").filter(Boolean);
  }, [searchParams]);

  useEffect(() => {
    const all = loadInventoryRecords();
    const sold = all.filter((item) => (item.status ?? item.stockStatus) === "売却済");
    if (requestedIds.length > 0) {
      const map = new Set(requestedIds);
      setInventories(all.filter((item) => map.has(item.id)));
      return;
    }
    setInventories(sold.slice(0, 1));
  }, [requestedIds]);

  return <SalesInvoiceLegacyVendorForm inventories={inventories} selectedIds={requestedIds} />;
}

export default function VendorSalesInvoiceCreatePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-700">Loading...</div>}>
      <VendorSalesInvoiceCreateContent />
    </Suspense>
  );
}
