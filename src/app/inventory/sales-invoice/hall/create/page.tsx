"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { SalesInvoiceLegacyHallForm } from "../_components/SalesInvoiceLegacyHallForm";
import { loadInventoryRecords, type InventoryRecord } from "@/lib/demo-data/demoInventory";

function HallSalesInvoiceCreateContent() {
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
      setInventories(sold.filter((item) => map.has(item.id)));
      return;
    }
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
