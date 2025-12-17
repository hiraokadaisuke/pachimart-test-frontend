import { Suspense } from "react";

import VendorInvoiceClient from "./VendorInvoiceClient";

export const dynamic = "force-dynamic";

export default function VendorInvoicePage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-600">読み込み中...</div>}>
      <VendorInvoiceClient />
    </Suspense>
  );
}
