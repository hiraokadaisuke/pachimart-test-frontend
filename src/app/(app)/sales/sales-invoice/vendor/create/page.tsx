"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SalesInvoiceLegacyVendorForm } from "../_components/SalesInvoiceLegacyVendorForm";

function VendorSalesInvoiceCreateContent() {
  const searchParams = useSearchParams();

  const idsParam = searchParams?.get("ids") ?? "";

  const requestedIds = useMemo(() => {
    const raw = idsParam;
    if (!raw) return [] as string[];

    const unique: string[] = [];
    const seen = new Set<string>();
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .forEach((id) => {
        if (!seen.has(id)) {
          unique.push(id);
          seen.add(id);
        }
      });
    return unique;
  }, [idsParam]);

  return <SalesInvoiceLegacyVendorForm selectedIds={requestedIds} />;
}

export default function VendorSalesInvoiceCreatePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-700">Loading...</div>}>
      <VendorSalesInvoiceCreateContent />
    </Suspense>
  );
}
