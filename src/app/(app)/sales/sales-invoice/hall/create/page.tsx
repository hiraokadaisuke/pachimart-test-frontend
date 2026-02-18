"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { SalesInvoiceLegacyHallForm } from "../_components/SalesInvoiceLegacyHallForm";
import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";

function HallSalesInvoiceCreateContent() {
  const searchParams = useSearchParams();
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);

  const idsParam = searchParams?.get("ids") ?? "";

  const requestedIds = useMemo(() => {
    const raw = idsParam;
    if (!raw) return [] as string[];
    return raw.split(",").filter(Boolean);
  }, [idsParam]);

  useEffect(() => {
    const all = loadInventoryRecords();
    if (requestedIds.length > 0) {
      const map = new Set(requestedIds);
      setInventories(all.filter((item) => map.has(item.id)));
      return;
    }
    const sold = all.filter((item) => (item.status ?? item.stockStatus) === "売却済");
    setInventories(sold.slice(0, 1));
  }, [requestedIds]);

  return <SalesInvoiceLegacyHallForm inventories={inventories} />;
}

export default function HallSalesInvoiceCreatePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-700">Loading...</div>}>
      <HallSalesInvoiceCreateContent />
    </Suspense>
  );
}
