import { Suspense } from "react";

import HallInvoiceClient from "./HallInvoiceClient";

export const dynamic = "force-dynamic";

export default function HallInvoicePage() {
  return (
    <Suspense fallback={<div className="text-sm text-neutral-600">読み込み中...</div>}>
      <HallInvoiceClient />
    </Suspense>
  );
}
